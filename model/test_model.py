"""Run python -m unittest discover -s model -v from the project root."""
import unittest, json
from pathlib import Path
import numpy as np
from train import features,label,predict_export,ROOT,START,STEP,SEED,generate_patient,make_dataset

class ModelContractTests(unittest.TestCase):
    def setUp(self):
        self.profile=dict(age=55,durationYears=8,baselineA1c=7.5,recordedAt=START-STEP)
        self.rows=[dict(timestamp=START+i*STEP,value=100+i*10) for i in range(5)]
        self.now=START+4*STEP
    def test_ols_population_std(self):
        x=features(self.profile,self.rows,self.now)
        np.testing.assert_allclose(x,[140,2/3,120,np.sqrt(200),55,8,7.5])
    def test_future_readings_cannot_change_features(self):
        expected=features(self.profile,self.rows,self.now)
        rows=self.rows+[dict(timestamp=self.now+STEP,value=399)]
        np.testing.assert_array_equal(features(self.profile,rows,self.now),expected)
    def test_future_static_profile_rejected(self):
        with self.assertRaisesRegex(ValueError,'future-profile'):
            features(dict(self.profile,recordedAt=self.now+1),self.rows,self.now)
    def test_split_isolation(self):
        s=json.loads((ROOT/'model/split-manifest.json').read_text())
        self.assertEqual(len(set(sum(s.values(),[]))),240)
        self.assertEqual([len(s[k]) for k in ['train','validation','test']],[144,48,48])
    def test_stale_boundary(self):
        features(self.profile,self.rows,self.now+2*STEP-1)
        with self.assertRaisesRegex(ValueError,'stale'): features(self.profile,self.rows,self.now+2*STEP)
    def test_missing_history(self):
        with self.assertRaisesRegex(ValueError,'cold-start'): features(self.profile,self.rows[:4],self.now)
        rows=[dict(r) for r in self.rows];rows[0]['timestamp']-=STEP
        with self.assertRaisesRegex(ValueError,'gap'): features(self.profile,rows,self.now)
    def test_duplicate_or_out_of_order(self):
        for rows in [self.rows+[self.rows[-1]],self.rows[::-1]]:
            with self.assertRaisesRegex(ValueError,'unordered-or-duplicate'): features(self.profile,rows,self.now)
    def test_invalid_units_values(self):
        with self.assertRaisesRegex(ValueError,'invalid-units'): features(self.profile,self.rows,self.now,'mmol/L')
        for bad in [float('nan'),float('inf'),39,401]:
            rows=[dict(r) for r in self.rows];rows[-1]['value']=bad
            with self.assertRaisesRegex(ValueError,'invalid-glucose'):features(self.profile,rows,self.now)
    def test_current_high_is_not_a_forecast(self):
        rows=[dict(r) for r in self.rows];rows[-1]['value']=181
        with self.assertRaisesRegex(ValueError,'current-above-range'):features(self.profile,rows,self.now)
        self.assertIsNone(label(np.array([181]+[190]*8),0))
    def test_event_needs_two_consecutive_future_points(self):
        self.assertEqual(label(np.array([140,181,181,140,140,140,140,140,140]),0),1)
        self.assertEqual(label(np.array([140,181,140,181,140,181,140,181,140]),0),0)
        self.assertEqual(label(np.array([140,180,180,140,140,140,140,140,140]),0),0)
    def test_future_window_boundary(self):
        self.assertEqual(label(np.array([140]*7+[181,181]),0),1)
        self.assertEqual(label(np.array([140]*8+[181,181]),0),0)
    def test_future_missing_is_unknown_not_negative(self):
        self.assertIsNone(label(np.array([140]*8),0))
        self.assertIsNone(label(np.array([140]*4+[np.nan]+[140]*4),0))
        self.assertIsNone(label(np.array([140]*9),0,[START+i*STEP+(STEP if i>4 else 0) for i in range(9)]))
    def test_training_export_parity(self):
        artifact=json.loads((ROOT/'public/model.json').read_text())
        fixtures=json.loads((ROOT/'public/model-parity.json').read_text())
        for fixture in fixtures:
            x=features(fixture['profile'],fixture['readings'],fixture['now'])
            np.testing.assert_allclose(x,fixture['features'],atol=1e-12)
            self.assertAlmostEqual(float(predict_export(artifact['models']['fused'],x)),fixture['fusedEstimate'],places=12)
    def test_demo_estimates_and_outcomes_match_export(self):
        model=json.loads((ROOT/'public/model.json').read_text())['models']['fused']
        demo=json.loads((ROOT/'public/model-demo.json').read_text())
        for patient in demo['patients']:
            rows=[{'timestamp':patient['startTimestamp']+r['minute']*60000,'value':r['value']} for r in patient['readings']]
            now=patient['startTimestamp']+16*STEP
            x=features(patient,rows,now)
            self.assertAlmostEqual(float(predict_export(model,x)),patient['expectedEstimate'],places=12)
            self.assertEqual(label(np.array([r['value'] for r in rows]),16),patient['expectedLabel'])
    def test_demo_missed_episode_has_no_advance_warning(self):
        model=json.loads((ROOT/'public/model.json').read_text())['models']['fused']
        patient=next(p for p in json.loads((ROOT/'public/model-demo.json').read_text())['patients'] if p['illustration']=='missedEpisode')
        g=np.array([r['value'] for r in patient['readings']])
        starts=[i for i in range(17,24) if g[i-1]<=180 and g[i]>180 and g[i+1]>180]
        self.assertTrue(starts)
        onset=starts[0]
        for origin in range(onset-7,onset):
            if g[origin]>180:continue
            rows=[{'timestamp':patient['startTimestamp']+j*STEP,'value':float(g[j])} for j in range(origin-4,origin+1)]
            x=features(patient,rows,patient['startTimestamp']+origin*STEP)
            self.assertLess(float(predict_export(model,x)),model['threshold'])
    def test_generator_reproducible(self):
        p,a=generate_patient(0,np.random.default_rng(SEED));q,b=generate_patient(0,np.random.default_rng(SEED))
        self.assertEqual(p,q);np.testing.assert_array_equal(a,b)
    def test_scaler_fitted_on_training_patients_only(self):
        _,_,data=make_dataset()
        artifact=json.loads((ROOT/'public/model.json').read_text())
        np.testing.assert_allclose(artifact['models']['fused']['mean'],data['train']['X'].mean(axis=0),rtol=1e-12)
        np.testing.assert_allclose(artifact['models']['fused']['scale'],data['train']['X'].std(axis=0),rtol=1e-12)
        self.assertFalse(np.allclose(artifact['models']['fused']['mean'],data['test']['X'].mean(axis=0)))
    def test_same_heldout_origins_for_all_models(self):
        e=json.loads((ROOT/'public/model-evidence.json').read_text())
        counts=[e['metrics'][k]['test']['windows'] for k in ['static','dynamic','fused','persistence']]
        self.assertEqual(len(set(counts)),1)
        self.assertAlmostEqual(e['metrics']['persistence']['test']['prAuc'],e['prevalence']['test'])

if __name__=='__main__': unittest.main()
