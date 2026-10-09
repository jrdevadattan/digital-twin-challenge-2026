"""Reproducible synthetic engineering benchmark. Not a physiological simulator."""
from pathlib import Path
import json, hashlib, platform
import numpy as np
import sklearn
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, precision_score, recall_score, roc_auc_score

ROOT = Path(__file__).resolve().parents[1]
SEED = 20261009
FEATURES = ['current','slopePerMinute','mean60','std60','age','durationYears','baselineA1c']
START = 1791504000000
STEP = 15 * 60000

def features(profile, readings, now, units='mg/dL'):
    """Identical five-point, trailing 60-minute contract used in browser inference."""
    if units != 'mg/dL': raise ValueError('invalid-units')
    if profile['recordedAt'] > now: raise ValueError('future-profile')
    stat = [profile[k] for k in FEATURES[4:]]
    if not all(np.isfinite(stat)) or not (18 <= stat[0] <= 100 and 0 <= stat[1] <= 70 and 4 <= stat[2] <= 15): raise ValueError('invalid-profile')
    if any(readings[i]['timestamp'] >= readings[i+1]['timestamp'] for i in range(len(readings)-1)): raise ValueError('unordered-or-duplicate')
    past = [r for r in readings if r['timestamp'] <= now]
    if len(past) < 5: raise ValueError('cold-start')
    window = past[-5:]
    if now - window[-1]['timestamp'] >= 2*STEP: raise ValueError('stale')
    if any(window[i+1]['timestamp']-window[i]['timestamp'] != STEP for i in range(4)): raise ValueError('gap')
    g = np.array([r['value'] for r in window], dtype=float)
    if not np.isfinite(g).all() or (g<40).any() or (g>400).any(): raise ValueError('invalid-glucose')
    if g[-1] > 180: raise ValueError('current-above-range')
    # x is centered; denominator = 2250 minute^2.
    slope = float(np.dot(np.array([-30,-15,0,15,30]),g)/2250)
    return np.array([g[-1],slope,g.mean(),g.std(ddof=0),*stat])

def label(glucose, i, timestamps=None):
    """All 8 future observations must exist; no interpolation across target gaps."""
    if not np.isfinite(glucose[i]) or glucose[i] > 180 or i+8 >= len(glucose): return None
    if timestamps is not None and any(timestamps[j+1]-timestamps[j] != STEP for j in range(i,i+8)): return None
    future = glucose[i+1:i+9]
    if not np.isfinite(future).all(): return None
    return int(any(future[j] > 180 and future[j+1] > 180 for j in range(7)))

def generate_patient(pid, rng, days=7):
    age = int(rng.integers(30,81)); duration = int(rng.integers(1,min(35,age-18)))
    a1c = round(float(np.clip(rng.normal(7.4,1.05),5.4,11.5)),1)
    profile = dict(id=f'synthetic-{pid:03d}', age=age,durationYears=duration,baselineA1c=a1c,recordedAt=START-86400000)
    n=96*days; t=np.arange(n)/4
    base=100+8*(a1c-6)+.12*(age-50)+.2*duration+rng.normal(0,9)
    glucose=np.full(n,base)+7*np.sin(2*np.pi*(t-4)/24)
    # Toy meal pulses and latent variability create predictable and unpredictable excursions.
    # No meal variables or future noise are supplied to the trained classifier.
    for day in range(days):
        for hour in [8,13,20]:
            onset=day*24+hour+rng.normal(0,.45)
            amp=max(10,rng.normal(35+8*(a1c-6)+.35*duration,18))
            elapsed=t-onset
            pulse=np.maximum(elapsed,0)/.65*np.exp(-np.maximum(elapsed,0)/.65)
            glucose += amp*np.e*pulse*(elapsed>=0)
    noise=np.zeros(n)
    for i in range(1,n): noise[i]=.78*noise[i-1]+rng.normal(0,3.5)
    glucose=np.round(np.clip(glucose+noise,45,350),2)
    return profile,glucose

def make_dataset():
    rng=np.random.default_rng(SEED)
    patients=[generate_patient(i,rng) for i in range(240)]
    split_rng=np.random.default_rng(SEED+1)
    ids=split_rng.permutation(240)
    partitions={'train':ids[:144].tolist(),'validation':ids[144:192].tolist(),'test':ids[192:].tolist()}
    data={}
    for name, selected in partitions.items():
        rows=[]; outcomes=[]; people=[]; origins=[]; future=[]
        for pid in selected:
            p,g=patients[pid]
            for i in range(4,len(g)-8):
                y=label(g,i)
                if y is None: continue
                readings=[dict(timestamp=START+j*STEP,value=g[j]) for j in range(i-4,i+1)]
                rows.append(features(p,readings,START+i*STEP)); outcomes.append(y); people.append(pid); origins.append(i);future.append(g[i+1:i+9])
        data[name]={'X':np.array(rows),'y':np.array(outcomes),'pid':np.array(people),'origin':np.array(origins),'future':np.array(future)}
    return patients,partitions,data

def metric(y,p, threshold):
    pred=p>=threshold
    bins=[]
    for low in np.arange(0,1,.1):
        mask=(p>=low)&(p<low+.1 if low<.9 else p<=1)
        if mask.any(): bins.append({'lower':float(low),'count':int(mask.sum()),'meanEstimate':float(p[mask].mean()),'observedFraction':float(y[mask].mean())})
    return {'calibrationBins':bins,'prAuc':float(average_precision_score(y,p)), 'rocAuc':float(roc_auc_score(y,p)), 'brier':float(brier_score_loss(y,p)), 'precision':float(precision_score(y,pred,zero_division=0)), 'recall':float(recall_score(y,pred,zero_division=0)), 'threshold':float(threshold),'positiveWindows':int(y.sum()),'windows':len(y)}

def export_model(pipeline, columns):
    scaler=pipeline[0]; clf=pipeline[1]
    return {'features':[FEATURES[i] for i in columns], 'mean':scaler.mean_.tolist(),'scale':scaler.scale_.tolist(),'coefficients':clf.coef_[0].tolist(),'intercept':float(clf.intercept_[0])}

def predict_export(artifact, x):
    z=(np.asarray(x)-artifact['mean'])/artifact['scale']
    logit=z@np.array(artifact['coefficients'])+artifact['intercept']
    return 1/(1+np.exp(-np.clip(logit,-700,700)))

def event_metrics(patients,d,probs,threshold):
    # Deduplicate alerts per 120-minute cooldown. Episode starts require prior <=180.
    events=[]; alerts=[]; leads=[]; captured=0
    for pid in np.unique(d['pid']):
        g=patients[pid][1]
        starts=[i for i in range(1,len(g)-1) if g[i-1]<=180 and g[i]>180 and g[i+1]>180]
        valid_origins=set(d['origin'][d['pid']==pid].tolist())
        # A forecastable episode has a complete eligible origin that can observe both high points.
        starts=[s for s in starts if any(i in valid_origins for i in range(max(4,s-7),s))]
        selected=np.where(d['pid']==pid)[0]; last=-100
        pa=[]
        for row in selected:
            origin=int(d['origin'][row])
            if probs[row]>=threshold and origin-last>=8:
                pa.append(origin); last=origin
        for s in starts:
            matches=[a for a in pa if a<s and s+1<=a+8]
            if matches: captured+=1; leads.append((s-min(matches))*15)
        alerts.extend((pid,a,any(a<s and s+1<=a+8 for s in starts)) for a in pa)
        events.extend((pid,s) for s in starts)
    return {'forecastableEpisodes':len(events),'episodesWarned':captured,'eventSensitivity':captured/len(events) if events else None,'deduplicatedAlerts':len(alerts),'falseAlerts':sum(not a[2] for a in alerts),'falseAlertsPerPatientDay':sum(not a[2] for a in alerts)/(len(np.unique(d['pid']))*7),'leadTimeMinutes':{'median':float(np.median(leads)) if leads else None,'min':min(leads) if leads else None,'max':max(leads) if leads else None},'cooldownMinutes':120,'denominatorPatientDays':len(np.unique(d['pid']))*7}

def main():
    patients,splits,data=make_dataset(); fitted={}; results={}; exported={}
    for name,cols in [('static',[4,5,6]),('dynamic',[0,1,2,3]),('fused',list(range(7)))]:
        model=make_pipeline(StandardScaler(),LogisticRegression(C=1,max_iter=1000,random_state=SEED))
        model.fit(data['train']['X'][:,cols],data['train']['y']); fitted[name]=model
        vp=model.predict_proba(data['validation']['X'][:,cols])[:,1]
        # Selection is frozen on validation, optimizing F1 across a prespecified grid.
        thresholds=np.arange(.1,.81,.05)
        def f1(th):
            pred=vp>=th;y=data['validation']['y'];tp=((pred==1)&(y==1)).sum()
            return 2*tp/max(1,pred.sum()+y.sum())
        th=float(max(thresholds,key=f1)); tp=model.predict_proba(data['test']['X'][:,cols])[:,1]
        results[name]={'validation':metric(data['validation']['y'],vp,th),'test':metric(data['test']['y'],tp,th),'events':event_metrics(patients,data['test'],tp,th)}
        exported[name]=export_model(model,cols); exported[name]['threshold']=th
    # Persistence predicts no future episode on the conservative eligible set.
    zeros=np.zeros(len(data['test']['y']))
    results['persistence']={'test':metric(data['test']['y'],zeros,.5),'events':event_metrics(patients,data['test'],zeros,.5)}
    # Linear extrapolation has fixed +/-1 mg/dL/min slope clipping, not a trained trajectory.
    continuous={}
    for method in ['persistence','linearTrend']:
        v=data['validation'];t=data['test'];h=np.arange(1,9)*15
        def trajectory(d): return d['X'][:,0,None]+(np.clip(d['X'][:,1,None],-1,1)*h if method=='linearTrend' else np.zeros((len(d['X']),8)))
        residual=np.abs(v['future']-trajectory(v)); q=np.quantile(residual,.9,axis=0,method='higher')
        err=t['future']-trajectory(t)
        continuous[method]={'interval90AbsoluteResidualMgDl':q.tolist(),'intervalMethod':'Per-horizon validation absolute residual 90th percentile; descriptive marginal band, not a clinical confidence interval. Correlated windows violate IID assumptions.','test':{str(m):{'mae':float(np.abs(err[:,j]).mean()),'rmse':float(np.sqrt((err[:,j]**2).mean())),'bandCoverage':float((np.abs(err[:,j])<=q[j]).mean())} for m,j in [(30,1),(60,3),(120,7)]}}
    # Patient-cluster bootstrap PR-AUC, preserving correlated within-person windows.
    rng=np.random.default_rng(SEED+2);test=data['test'];p=fitted['fused'].predict_proba(test['X'])[:,1];boot=[]
    ids=np.unique(test['pid']);groups={pid:np.where(test['pid']==pid)[0] for pid in ids}
    for _ in range(300):
        ix=np.concatenate([groups[pid] for pid in rng.choice(ids,len(ids),replace=True)])
        boot.append(average_precision_score(test['y'][ix],p[ix]))
    results['fused']['test']['prAucPatientBootstrap95']=np.quantile(boot,[.025,.975]).tolist()
    examples=[]
    th=exported['fused']['threshold']
    for kind,mask in [('falsePositive',(p>=th)&(test['y']==0)),('missedEventWindow',(p<th)&(test['y']==1)),('successfulWarning',(p>=th)&(test['y']==1))]:
        rows=np.where(mask)[0]
        if len(rows):
            i=int(rows[len(rows)//2]);examples.append({'kind':kind,'patientId':patients[test['pid'][i]][0]['id'],'originIndex':int(test['origin'][i]),'estimate':float(p[i]),'label':int(test['y'][i]),'features':test['X'][i].tolist(),'futureActualMgDl':test['future'][i].tolist()})
    artifact={'version':'glucotwin-synthetic-logistic-v1','source':'Synthetic toy generator, seed 20261009. No real patient data.','features':FEATURES,'eventDefinition':'Two consecutive 15-minute values >180 mg/dL among the next eight readings (120 minutes). Current value >180 excluded conservatively. Missing future labels unknown.','windowPoints':5,'stepMinutes':15,'staleAfterMinutes':30,'models':exported,'continuous':continuous,'limitations':['Synthetic engineering demonstration only; no clinical calibration or real-world accuracy established.','Static features influence the synthetic generator by design; fusion improvement is not scientific evidence.','UI traces are selected held-out synthetic illustrations, not representative clinical performance.','No treatment or dosing recommendations.','Separate baseline trajectories and logistic episode estimates may disagree; baseline trajectory is not a fused-model forecast.']}
    evidence={'version':artifact['version'],'seed':SEED,'syntheticOnly':True,'patients':240,'daysPerPatient':7,'splitCounts':{k:len(v) for k,v in splits.items()},'splits':splits,'eligibleWindows':{k:len(v['y']) for k,v in data.items()},'prevalence':{k:float(v['y'].mean()) for k,v in data.items()},'eventProtocol':artifact['eventDefinition'],'thresholdSelection':'Validation F1 over fixed 0.10..0.80 grid (0.05 step), separately per model; test used once for evaluation. Alert burden differs across models.','metrics':results,'continuous':continuous,'examples':examples,'bootstrap':'300 resamples of held-out patients; percentile 95% interval. Synthetic uncertainty only.','software':{'python':platform.python_version(),'numpy':np.__version__,'scikitLearn':sklearn.__version__},'limitations':artifact['limitations']}
    parity=[]
    for i in range(0,min(100,len(test['X'])),10):
        pid=int(test['pid'][i]);origin=int(test['origin'][i]);profile,g=patients[pid]
        parity.append({'profile':profile,'readings':[{'timestamp':START+j*STEP,'value':float(g[j])} for j in range(origin-4,origin+1)],'now':START+origin*STEP,'features':test['X'][i].tolist(),'fusedEstimate':float(p[i])})
    # A genuine missed episode for replay: no eligible origin before onset exceeds
    # threshold, even without cooldown. Distinguish this from a single missed window.
    missed_episode_rows=np.zeros(len(p),dtype=bool)
    for pid in np.unique(test['pid']):
        g=patients[pid][1];ix=np.where(test['pid']==pid)[0]
        for onset in range(1,len(g)-1):
            if not (g[onset-1]<=180 and g[onset]>180 and g[onset+1]>180):continue
            eligible=ix[(test['origin'][ix]<onset)&(test['origin'][ix]+8>=onset+1)]
            if len(eligible) and np.all(p[eligible]<th):missed_episode_rows[eligible]=True
    demo=[]
    candidates=[('successfulWarning',(p>=th)&(test['y']==1),.4),('falsePositive',(p>=th)&(test['y']==0),.35),('missedEpisode',missed_episode_rows,.08),('stable',(p<th)&(test['y']==0),.02)]
    for k,(kind,mask,target) in enumerate(candidates):
        valid=mask&(test['origin']>=16)&(test['origin']<96*7-16)
        rows=np.where(valid)[0]
        row=int(rows[np.argmin(np.abs(p[rows]-target))]);pid=int(test['pid'][row]);origin=int(test['origin'][row])
        profile,g=patients[pid];start=origin-16
        demo.append(dict(profile,id=f'GT-{k+1:03d}',syntheticPatientId=profile['id'],startTimestamp=START+start*STEP,readings=[{'minute':j*15,'value':float(g[start+j])} for j in range(33)],illustration=kind,initialStep=16,expectedEstimate=float(p[row]),expectedLabel=int(test['y'][row])))
    demo_artifact={'source':'Selected held-out synthetic illustrations, not representative performance. Full future fixtures must remain hidden until replay time.','patients':demo}
    for name,obj in [('model.json',artifact),('model-evidence.json',evidence),('model-parity.json',parity),('model-demo.json',demo_artifact)]:
        (ROOT/'public'/name).write_text(json.dumps(obj,indent=2)+'\n')
    (ROOT/'model'/'split-manifest.json').write_text(json.dumps(splits,indent=2)+'\n')
    print(json.dumps({'windows':evidence['eligibleWindows'],'prevalence':evidence['prevalence'],'models':{k:v['test'] for k,v in results.items()}},indent=2))

if __name__=='__main__': main()
