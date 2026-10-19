from services.judge0_service import execute_code


cpp_code = """
#include <iostream>
using namespace std;

int main() {

    int a, b;

    cin >> a >> b;

    cout << a + b << endl;

    return 0;
}
"""


result = execute_code(
    source_code=cpp_code,
    language="cpp",
    stdin="10 20\n",
)


print("Judge0 Result:")
print(result)