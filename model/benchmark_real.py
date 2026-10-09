"""Aggregate-only retrospective ShanghaiT2DM benchmark. Never writes source rows/predictions."""
from pathlib import Path
import argparse,hashlib,json,platform
import numpy as np
import pandas as pd
import sklearn
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score
from train import metric,SEED,ROOT
FEATURES=['current','slope60PerMinute','mean60','std60','mean345','std345','age','recordedGenderFemale1Male2']

def real_label(g,t,i):
    if i+8>=len(g) or g[i]>180 or not np.isfinite(g[i:i+9]).all() or not np.all(np.diff(t[i:i+9])==15):return None
    high=g[i+1:i+9]>180
    return int(np.any(high[:-1]&high[1:]))

def read_data(raw):
    summary=pd.read_excel(raw/'Shanghai_T2DM_Summary.xlsx').set_index('Patient Number')
    files=[p for p in (raw/'Shanghai_T2DM').iterdir() if p.suffix in {'.xls','.xlsx'}]
    assert summary.index.is_unique and set(summary.index)=={p.stem for p in files}, 'Non-unique or unmatched summary/session join'
    assert pd.to_numeric(summary['Age (years)']).ge(18).all(), 'Non-adult source participant'
    audit={'rawRows':0,'missingCGM':0,'gapsOver15Minutes':0,'bareCGMHeaders':0,'timezoneNaive':True}
    sessions=[]
    for file in sorted((raw/'Shanghai_T2DM').iterdir()):
        if file.suffix not in {'.xls','.xlsx'}:continue
        s=summary.loc[file.stem];f=pd.read_excel(file);f.columns=[str(c).strip() for c in f.columns]
        col=next(c for c in f.columns if c.startswith('CGM'))
        assert col in ['CGM','CGM (mg / dl)'], 'Unexpected CGM unit/header'
        audit['bareCGMHeaders']+=int(col=='CGM');audit['rawRows']+=len(f);audit['missingCGM']+=int(f[col].isna().sum())
        parsed=pd.to_datetime(f['Date'],errors='coerce')
        assert parsed.dt.tz is None, 'Unexpected source timezone'
        assert not (f[col].notna()&pd.to_numeric(f[col],errors='coerce').isna()).any(), 'Nonnumeric source value requires audit'
        a=pd.DataFrame({'t':pd.to_datetime(f['Date'],errors='coerce'),'g':pd.to_numeric(f[col],errors='coerce')}).dropna()
        if a.t.duplicated().any() or not a.t.is_monotonic_increasing:raise ValueError('Source requires duplicate/order audit')
        g=a.g.to_numpy();t=a.t.to_numpy(dtype='datetime64[m]').astype('int64')
        audit['gapsOver15Minutes']+=int((np.diff(t)>15).sum())
        age=float(s['Age (years)']);gender=float(s['Gender (Female=1, Male=2)'])
        if not (age>=18 and gender in [1,2]):raise ValueError('Ineligible static fields')
        sessions.append({'person':file.stem.split('_')[0],'g':g,'t':t,'age':age,'gender':gender})
    assert len(sessions)==109 and len(set(s['person'] for s in sessions))==100, 'Unexpected source release counts'
    ids=np.array(sorted(set(s['person'] for s in sessions)));ids=np.random.default_rng(SEED+31).permutation(ids)
    split={'train':set(ids[:60]),'validation':set(ids[60:80]),'test':set(ids[80:])};out={}
    for name,pids in split.items():
        X=[];y=[];person=[];session=[];origin=[];future=[]
        for sid,s in enumerate(sessions):
            if s['person'] not in pids:continue
            g=s['g'];t=s['t']
            for i in range(23,len(g)-8):
                target=real_label(g,t,i)
                if target is None or not np.all(np.diff(t[i-23:i+1])==15):continue
                r=g[i-4:i+1];long=g[i-23:i+1]
                X.append([g[i],np.dot([-30,-15,0,15,30],r)/2250,r.mean(),r.std(),long.mean(),long.std(),s['age'],s['gender']])
                y.append(target)
                person.append(s['person']);session.append(sid);origin.append(i);future.append(g[i+1:i+9])
        out[name]={'X':np.array(X),'y':np.array(y),'person':np.array(person),'session':np.array(session),'origin':np.array(origin),'future':np.array(future)}
    assert audit=={'rawRows':112475,'missingCGM':13,'gapsOver15Minutes':11,'bareCGMHeaders':2,'timezoneNaive':True}, 'Source audit counts changed'
    return sessions,split,out,audit

def events(sessions,d,p,threshold):
    count=hit=false=alerts=0;lead=[];days=0
    for sid in np.unique(d['session']):
        s=sessions[sid];g=s['g'];t=s['t'];days+=(t[-1]-t[0]+15)/1440
        ix=np.where(d['session']==sid)[0];origins=set(d['origin'][ix].tolist())
        starts=[i for i in range(1,len(g)-1) if g[i-1]<=180 and g[i]>180 and g[i+1]>180 and t[i]-t[i-1]==15 and t[i+1]-t[i]==15 and any(j in origins for j in range(max(23,i-7),i))]
        last=-1e20;aa=[]
        for row in ix:
            i=int(d['origin'][row])
            if p[row]>=threshold and t[i]-last>=120:aa.append(i);last=t[i]
        count+=len(starts);alerts+=len(aa)
        false+=sum(not any(t[a]<t[b] and t[b+1]<=t[a]+120 for b in starts) for a in aa)
        for b in starts:
            matched=[a for a in aa if t[a]<t[b] and t[b+1]<=t[a]+120]
            if matched:hit+=1;lead.append(int(t[b]-t[min(matched)]))
    return {'forecastableEpisodes':count,'episodesWarned':hit,'eventSensitivity':hit/count if count else None,'deduplicatedAlerts':alerts,'falseAlerts':false,'monitoredPatientDays':float(days),'denominatorDefinition':'Recorded-span patient-days: last minus first observation plus 15 minutes, including gaps and current-high periods; not sensor uptime or eligible forecast days.','falseAlertsPerPatientDay':false/days,'leadTimeMedianMinutes':float(np.median(lead)) if lead else None,'cooldownMinutes':120}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--data-dir',type=Path,required=True);parser.add_argument('--output',type=Path,default=ROOT/'model/real-benchmark-evidence.json');args=parser.parse_args()
    sessions,split,data,source_audit=read_data(args.data_dir);results={};probs={}
    for name,cols in [('static',[6,7]),('dynamic',list(range(6))),('fused',list(range(8)))]:
        model=make_pipeline(StandardScaler(),LogisticRegression(C=1,max_iter=1000,random_state=SEED))
        model.fit(data['train']['X'][:,cols],data['train']['y'])
        vp=model.predict_proba(data['validation']['X'][:,cols])[:,1];vy=data['validation']['y']
        def f1(th):return 2*((vp>=th)&(vy==1)).sum()/max(1,(vp>=th).sum()+vy.sum())
        threshold=float(max(np.arange(.1,.81,.05),key=f1));test=data['test'];p=model.predict_proba(test['X'][:,cols])[:,1];probs[name]=p
        results[name]={'validation':metric(vy,vp,threshold),'test':metric(test['y'],p,threshold),'events':events(sessions,test,p,threshold)}
    test=data['test'];z=np.zeros(len(test['y']));results['persistence']={'test':metric(test['y'],z,.5),'events':events(sessions,test,z,.5)}
    rng=np.random.default_rng(SEED+32);ids=np.unique(test['person']);boot={k:[] for k in probs};groups={pid:np.where(test['person']==pid)[0] for pid in ids}
    for _ in range(300):
        ix=np.concatenate([groups[pid] for pid in rng.choice(ids,len(ids),replace=True)])
        for name,p in probs.items():boot[name].append(average_precision_score(test['y'][ix],p[ix]))
    for name,values in boot.items():results[name]['test']['prAucPatientBootstrap95']=np.quantile(values,[.025,.975]).tolist()
    results['fused']['test']['prAucMinusDynamicPatientBootstrap95']=np.quantile(np.array(boot['fused'])-np.array(boot['dynamic']),[.025,.975]).tolist()
    continuous={}
    for name in ['persistence','linearTrend']:
        def traj(d):return d['X'][:,0,None]+(np.clip(d['X'][:,1,None],-1,1)*np.arange(15,121,15) if name=='linearTrend' else np.zeros((len(d['X']),8)))
        v=data['validation'];q=np.quantile(abs(v['future']-traj(v)),.9,axis=0,method='higher');e=test['future']-traj(test)
        continuous[name]={str(m):{'mae':float(abs(e[:,j]).mean()),'rmse':float(np.sqrt((e[:,j]**2).mean())),'validationResidual90MgDl':float(q[j]),'testBandCoverage':float((abs(e[:,j])<=q[j]).mean())} for m,j in [(30,1),(60,3),(120,7)]}
    # Save only aggregate results. Patient identities, rows, predictions and fitted coefficients stay in memory.
    out={'kind':'Real retrospective feasibility benchmark; separate from synthetic UI model','syntheticOnly':False,'deployedInDemo':False,'version':'shanghai-t2dm-retrospective-v1','source':'https://figshare.com/articles/dataset/diabetes_datasets_zip/21600933/5','doi':'10.6084/m9.figshare.21600933.v5','license':'CC BY 4.0','attribution':'Zhao et al., Chinese diabetes datasets for data-driven machine learning, Scientific Data (2023), doi:10.1038/s41597-023-01940-7; Figshare release5. Modified by deriving trailing features and aggregate benchmark results.','sourceArchiveSha256':'59b5f5c4053a32bb6b7827844a0191597dc82228fe88ce332a189fdfc659c4cb','seed':SEED,'splitSeed':SEED+31,'people':len(set(s['person'] for s in sessions)),'sessions':len(sessions),'sourceAudit':source_audit,'splitCounts':{k:len(v) for k,v in split.items()},'splitManifestDigest':hashlib.sha256(json.dumps({k:sorted(v) for k,v in split.items()},sort_keys=True).encode()).hexdigest(),'eligibleWindows':{k:len(v['y']) for k,v in data.items()},'prevalence':{k:float(v['y'].mean()) for k,v in data.items()},'features':FEATURES,'eligibility':'24 contiguous past/current readings (345-minute span), current<=180, 8 contiguous future readings. No missing target interpolation. Preserve measured glucose 39.6–468; do not clip input.','target':'Two consecutive >180 mg/dL readings fully within next 120 minutes. Missing future outcomes unknown.','staticTimingAssumption':'Age and recorded gender are untimestamped summary context, assumed available at enrollment for this retrospective feasibility analysis; prospective availability is not proven. No laboratory, duration, BMI, complication, treatment or outcome-summary features used.','thresholdSelection':'Validation F1 over fixed 0.10–0.80 grid, step 0.05, separate per model. Test not used for tuning; alert burdens not matched.','metrics':results,'continuousBaselines':continuous,'bootstrap':'300 patient-cluster resamples; only 20 held-out people, uncertainty is substantial.','fusionConclusion':'The paired 95% bootstrap interval for fused-minus-dynamic PR-AUC includes zero; a meaningful fusion advantage is not established.','limits':['Retrospective single-source Chinese dataset; no Indian-population or prospective clinical validation.','No verified prospective timestamps for static summary context.','All sessions for each person held in one split; overlapping windows remain correlated.','Real benchmark model is NOT the synthetic browser model and is not deployed in the demo.','No row-level source records, traces, per-person predictions or real fitted coefficients exported.','Threshold tuned for F1, not clinical utility; false-alert burden must be considered.'],'software':{'python':platform.python_version(),'numpy':np.__version__,'pandas':pd.__version__,'sklearn':sklearn.__version__}}
    assert not (split['train']&split['validation'] or split['train']&split['test'] or split['validation']&split['test'])
    assert sum(out['eligibleWindows'].values())==88715, 'Audit eligibility count mismatch'
    assert sum(int(d['y'].sum()) for d in data.values())==10782, 'Audit target count mismatch'
    args.output.write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'windows':out['eligibleWindows'],'metrics':{k:v['test'] for k,v in results.items()}},indent=2))
if __name__=='__main__':main()
