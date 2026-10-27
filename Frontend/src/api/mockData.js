// Mock data engine for offline/demo testing of AI Coach features

export const SAMPLE_QUESTIONS = {
  technical: [
    {
      question: "Could you explain how attention mechanisms work in Transformers, and why self-attention has quadratic time complexity with respect to sequence length?",
      question_type: "technical",
      topic: "Machine Learning & GenAI",
      difficulty: "medium",
      reason: "Evaluating deep architectural understanding of modern foundation models."
    },
    {
      question: "What is the difference between optimistic and pessimistic locking in distributed databases, and in what scenarios would you choose one over the other?",
      question_type: "technical",
      topic: "System Design & Distributed Systems",
      difficulty: "medium",
      reason: "Assessing concurrency control and high-load system architecture skills."
    },
    {
      question: "Explain the Global Interpreter Lock (GIL) in CPython. How does it affect multithreaded CPU-bound tasks versus I/O-bound tasks, and how does free-threaded Python 3.13 change this?",
      question_type: "technical",
      topic: "Python Internals",
      difficulty: "hard",
      reason: "Probing deep language runtime internals."
    }
  ],
  coding: [
    {
      question: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. Provide your code in the editor and analyze time and space complexity.",
      question_type: "coding",
      topic: "Data Structures and Algorithms",
      difficulty: "easy",
      reason: "Fundamental hash map lookup pattern testing."
    },
    {
      question: "Design an algorithm to find the longest palindromic substring in a given string s. State the time and space complexity, and write the implementation.",
      question_type: "coding",
      topic: "Data Structures and Algorithms",
      difficulty: "medium",
      reason: "Evaluating dynamic programming and expand-around-center algorithms."
    }
  ],
  behavioral: [
    {
      question: "Tell me about a time when you disagreed with a senior engineer or technical lead on an architectural decision. How did you handle the situation, and what was the outcome?",
      question_type: "behavioral",
      topic: "Technical Leadership & Conflict Resolution",
      difficulty: "medium",
      reason: "Evaluating collaboration, communication, and decision-making under disagreement."
    }
  ]
};

export function generateMockEvaluation(answer, code, difficulty) {
  const hasCode = code && code.trim().length > 10;
  const isLengthy = answer && answer.trim().length > 100;
  
  let score = 7;
  if (hasCode && isLengthy) score = 9;
  else if (hasCode || isLengthy) score = 8;
  else if (answer && answer.length < 30) score = 4;

  const nextDiff = score >= 8 ? "hard" : score <= 4 ? "easy" : "medium";
  const rating = score >= 8 ? "excellent" : score >= 6 ? "good" : score >= 4 ? "average" : "poor";

  return {
    score: score,
    correct: score >= 5,
    rating: rating,
    strengths: [
      "Clear explanation of the core technical concepts.",
      "Identified critical trade-offs and edge cases.",
      hasCode ? "Implemented clean, structured syntax with proper indentation." : "Articulated logical reasoning step-by-step."
    ],
    weaknesses: [
      score < 8 ? "Could elaborate more on time/space computational complexity." : "Briefly missed considering high-concurrency memory limits.",
      "Consider discussing real-world production monitoring or observability."
    ],
    missing_points: [
      "Handling unexpected null or boundary edge conditions.",
      "Mentioning cache locality or garbage collection impact."
    ],
    technical_feedback: `Your response shows solid intuition. You demonstrated a good grasp of the foundational principles. To elevate this to staff-level engineering, emphasize empirical performance metrics, profiling, and asymptotic bounds.`,
    improved_answer: `A top-tier response would outline the approach in 3 distinct parts: 1) State the mathematical/algorithmic premise; 2) Walk through an optimal implementation with guard clauses; 3) Conclude with Big-O runtime (e.g. O(N) time and O(N) auxiliary space) and hardware considerations.`,
    recommended_difficulty: nextDiff
  };
}

export const SAMPLE_CODING_PROBLEMS = [
  {
    id: "sum_two_numbers",
    title: "Sum Two Numbers",
    difficulty: "easy",
    description: "Read two space-separated integers a and b from standard input (stdin) and print their sum to standard output.",
    sampleInput: "10 20",
    sampleOutput: "30",
    defaultCode: {
      python: `# Read input from standard input and print sum\nimport sys\n\nline = sys.stdin.read().strip()\nif line:\n    a, b = map(int, line.split())\n    print(a + b)\n`,
      javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n  const [a, b] = input.split(/\\s+/).map(Number);\n  console.log(a + b);\n}`,
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        cout << a + b << endl;\n    }\n    return 0;\n}`,
      java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(a + b);\n        }\n    }\n}`,
      c: `#include <stdio.h>\n\nint main() {\n    int a, b;\n    if (scanf("%d %d", &a, &b) == 2) {\n        printf("%d\\n", a + b);\n    }\n    return 0;\n}`
    }
  },
  {
    id: "reverse_string",
    title: "Reverse a String",
    difficulty: "easy",
    description: "Read a string from standard input and print the reversed string.",
    sampleInput: "hello world",
    sampleOutput: "dlrow olleh",
    defaultCode: {
      python: `import sys\ntext = sys.stdin.read().strip()\nprint(text[::-1])\n`,
      javascript: `const fs = require('fs');\nconst text = fs.readFileSync(0, 'utf-8').trim();\nconsole.log(text.split('').reverse().join(''));`,
      cpp: `#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    string s;\n    getline(cin, s);\n    reverse(s.begin(), s.end());\n    cout << s << endl;\n    return 0;\n}`,
      java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        System.out.println(new StringBuilder(s).reverse().toString());\n    }\n}`,
      c: `#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[1000];\n    if (fgets(s, sizeof(s), stdin)) {\n        int len = strlen(s);\n        while(len > 0 && (s[len-1] == '\\n' || s[len-1] == '\\r')) len--;\n        for (int i = len - 1; i >= 0; i--) putchar(s[i]);\n        putchar('\\n');\n    }\n    return 0;\n}`
    }
  }
];
