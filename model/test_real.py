"""Aggregate integrity checks; no source clinical files are read by these tests."""
import unittest,json
import numpy as np
from benchmark_real import real_label
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class RealHorizonTests(unittest.TestCase):
    def test_real_horizon_gap_and_missing_are_unknown(self):
        g=np.array([140.,150,170,185,195,170,140,135,130]);t=np.arange(9)*15
        self.assertEqual(real_label(g,t,0),1)
        gap=t.copy();gap[5:]+=15
        self.assertIsNone(real_label(g,gap,0))
        missing=g.copy();missing[7]=np.nan
        self.assertIsNone(real_label(missing,t,0))
        self.assertIsNone(real_label(g[:-1],t[:-1],0))
    def test_real_strict_threshold_and_pair_boundary(self):
        t=np.arange(10)*15
        self.assertEqual(real_label(np.array([140.]*7+[181,181,140]),t,0),1)
        self.assertEqual(real_label(np.array([140.]*8+[181,181]),t,0),0)
        self.assertEqual(real_label(np.array([140.]*7+[180,180,140]),t,0),0)

class RealBenchmarkEvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        path=ROOT/'model/real-benchmark-evidence.json'
        if not path.exists():raise unittest.SkipTest('Optional real benchmark has not been run')
        cls.e=json.loads(path.read_text())
    def test_matches_independent_audit(self):
        self.assertEqual(self.e['people'],100);self.assertEqual(self.e['sessions'],109)
        self.assertEqual(sum(self.e['eligibleWindows'].values()),88715)
        self.assertEqual(self.e['splitCounts'],{'train':60,'validation':20,'test':20})
    def test_common_test_origins(self):
        counts=[v['test']['windows'] for v in self.e['metrics'].values()]
        self.assertEqual(len(set(counts)),1)
        self.assertEqual(counts[0],self.e['eligibleWindows']['test'])
    def test_no_unsafe_static_features(self):
        self.assertEqual(self.e['features'][6:],['age','recordedGenderFemale1Male2'])
        self.assertIn('not proven',self.e['staticTimingAssumption'])
    def test_no_rowlevel_export(self):
        self.assertNotIn('splits',self.e);self.assertNotIn('examples',self.e)
        self.assertNotIn('predictions',self.e);self.assertNotIn('coefficients',self.e)
        self.assertEqual(len(self.e['splitManifestDigest']),64)
    def test_baseline_and_metric_bounds(self):
        self.assertAlmostEqual(self.e['metrics']['persistence']['test']['prAuc'],self.e['prevalence']['test'])
        for v in self.e['metrics'].values():
            for k in ['prAuc','brier','precision','recall']:
                self.assertGreaterEqual(v['test'][k],0);self.assertLessEqual(v['test'][k],1)
            self.assertLessEqual(v['events']['episodesWarned'],v['events']['forecastableEpisodes'])
if __name__=='__main__':unittest.main()
