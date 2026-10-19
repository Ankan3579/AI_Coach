from services.judge0_service import execute_code


def normalize_output(output: str | None) -> str:

    if output is None:
        return ""

    return output.strip()


def evaluate_code(
    source_code: str,
    language: str,
    test_cases: list[dict],
) -> dict:

    results = []

    passed_tests = 0

    for index, test_case in enumerate(test_cases, start=1):

        print(f"\n========== TEST CASE {index} ==========")

        print("Input:")
        print(test_case["input"])

        # Execute code through Judge0
        result = execute_code(
            source_code=source_code,
            language=language,
            stdin=test_case["input"],
        )

        print("Judge0 Result:")
        print(result)

        # ---------------------------------------
        # Check execution status
        # ---------------------------------------

        status = result.get("status")

        if isinstance(status, dict):

            status_description = status.get(
                "description",
                ""
            )

        else:

            status_description = str(status or "")

        # ---------------------------------------
        # Handle execution failure
        # ---------------------------------------

        if status_description != "Accepted":

            results.append({
                "test_case": index,
                "passed": False,
                "status": status_description,
                "expected_output": test_case[
                    "expected_output"
                ],
                "actual_output": result.get(
                    "stdout"
                ),
                "stderr": result.get(
                    "stderr"
                ),
                "compile_output": result.get(
                    "compile_output"
                ),
            })

            continue

        # ---------------------------------------
        # Compare output
        # ---------------------------------------

        actual_output = normalize_output(
            result.get("stdout")
        )

        expected_output = normalize_output(
            test_case["expected_output"]
        )

        passed = (
            actual_output == expected_output
        )

        if passed:
            passed_tests += 1

        results.append({
            "test_case": index,
            "passed": passed,
            "status": status_description,
            "expected_output": expected_output,
            "actual_output": actual_output,
            "stderr": result.get("stderr"),
            "execution_time": result.get("time"),
            "memory": result.get("memory"),
        })

    # ---------------------------------------
    # Calculate score
    # ---------------------------------------

    total_tests = len(test_cases)

    failed_tests = (
        total_tests - passed_tests
    )

    score_percentage = (
        round(
            (passed_tests / total_tests) * 100,
            2
        )
        if total_tests > 0
        else 0
    )

    return {
        "total_tests": total_tests,
        "passed_tests": passed_tests,
        "failed_tests": failed_tests,
        "score_percentage": score_percentage,
        "all_passed": (
            total_tests > 0
            and passed_tests == total_tests
        ),
        "results": results,
    }