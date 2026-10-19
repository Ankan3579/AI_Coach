from services.judge0_service import execute_code


def evaluate_code(
    source_code: str,
    language: str,
    test_cases: list[dict],
) -> dict:

    results = []

    for test_case in test_cases:

        execution = execute_code(
            source_code=source_code,
            language=language,
            stdin=test_case["input"],
        )

        actual_output = (
            execution.get("stdout") or ""
        ).strip()

        expected_output = (
            test_case["expected_output"]
        ).strip()

        passed = (
            execution.get("status_id") == 3
            and actual_output == expected_output
        )

        results.append({
            "passed": passed,
            "expected_output": expected_output,
            "actual_output": actual_output,
            "status": execution.get("status"),
            "execution_time": execution.get(
                "execution_time"
            ),
            "memory": execution.get("memory"),
        })

    total = len(results)

    passed_count = sum(
        item["passed"] for item in results
    )

    return {
        "total_tests": total,
        "passed_tests": passed_count,
        "failed_tests": total - passed_count,
        "score_percentage": (
            round(passed_count / total * 100, 2)
            if total else 0
        ),
        "all_passed": (
            total > 0 and passed_count == total
        ),
        "results": results,
    }