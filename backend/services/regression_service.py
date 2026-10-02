class RegressionService:
    """
    Compares two evaluation runs (Run A vs Run B) for regression testing and performance impact analysis.
    """

    def compare_runs(self, base_run, current_run):
        score_diff = current_run.overall_score - base_run.overall_score
        task_diff = current_run.task_success_rate - base_run.task_success_rate
        tool_diff = current_run.tool_accuracy_score - base_run.tool_accuracy_score
        safety_diff = current_run.safety_score - base_run.safety_score
        latency_diff = current_run.avg_latency - base_run.avg_latency
        step_diff = current_run.avg_steps - base_run.avg_steps

        # Map results by test_case_id
        base_map = {r.test_case_id: r for r in base_run.results}
        current_map = {r.test_case_id: r for r in current_run.results}

        fixed_cases = []
        new_failures = []
        unchanged_passing = []
        unchanged_failing = []

        all_case_ids = set(base_map.keys()).union(set(current_map.keys()))

        for cid in all_case_ids:
            base_res = base_map.get(cid)
            curr_res = current_map.get(cid)

            if not base_res or not curr_res:
                continue

            test_info = {
                'test_case_id': cid,
                'test_code': curr_res.test_case.test_code if curr_res.test_case else 'TC-???',
                'category': curr_res.test_case.category if curr_res.test_case else 'Unknown',
                'user_input': curr_res.test_case.user_input if curr_res.test_case else '',
                'base_passed': base_res.passed,
                'current_passed': curr_res.passed,
                'base_score': base_res.score,
                'current_score': curr_res.score,
                'score_delta': round(curr_res.score - base_res.score, 1)
            }

            if not base_res.passed and curr_res.passed:
                fixed_cases.append(test_info)
            elif base_res.passed and not curr_res.passed:
                test_info['new_failure_cause'] = curr_res.failure_cause or 'Unspecified failure'
                test_info['suggestion'] = curr_res.suggestion
                new_failures.append(test_info)
            elif base_res.passed and curr_res.passed:
                unchanged_passing.append(test_info)
            else:
                unchanged_failing.append(test_info)

        return {
            'base_run_id': base_run.id,
            'current_run_id': current_run.id,
            'base_run_date': base_run.created_at.isoformat() if base_run.created_at else None,
            'current_run_date': current_run.created_at.isoformat() if current_run.created_at else None,
            'metrics_delta': {
                'overall_score': round(score_diff, 1),
                'task_success_rate': round(task_diff, 1),
                'tool_accuracy_score': round(tool_diff, 1),
                'safety_score': round(safety_diff, 1),
                'latency_ms': round(latency_diff, 1),
                'steps': round(step_diff, 2)
            },
            'summary': {
                'fixed_count': len(fixed_cases),
                'new_failures_count': len(new_failures),
                'unchanged_passing_count': len(unchanged_passing),
                'unchanged_failing_count': len(unchanged_failing)
            },
            'fixed_test_cases': fixed_cases,
            'new_failures': new_failures,
            'unchanged_failing': unchanged_failing
        }
