from langchain_ollama import ChatOllama

llm = ChatOllama(
    model="qwen2.5:7b",
    temperature=0,
    max_tokens = 300
)

response = llm.invoke(
    "what is AI in simple term ."
)

print(response.content , flush=True)