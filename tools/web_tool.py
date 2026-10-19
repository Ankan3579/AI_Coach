from dotenv import load_dotenv
from langchain.tools import tool
from tavily import TavilyClient
import os
import requests
from bs4 import BeautifulSoup

load_dotenv()

api_key = os.getenv("TAVILY_API_KEY")
client = TavilyClient(api_key=api_key)

@tool
def web_tool( goal: str, current_level: str=" ", target_timeline: str="",  preferences: str=" " ) -> str:
    """
    A tool that uses Tavily to search the web and return relevant information like wikipedea , news, and other sources. It takes a user query as input and it will return Title: , url: , content: 

    """
    user_query = f"goal: {goal} , current_level: {current_level}  , target_timeline: {target_timeline} , preferences: {preferences}"

    # Use Tavily to search the web
    try:
        response = client.search(api_key=api_key , query=user_query)
        out = []
        results = response.get("results",[])
        if not results:
            return "No results found"

        for result in results:
            title  = result.get("title" , "N/A")
            url  = result.get("url" , "N/A")
            content  = result.get("content" , "N/A")

        out.append(f"Title: {title}\n URL:{url}\n Content:{content}")

        return "\n\n".join(out)

    except Exception as e:
        return f"An error occurred while searching the web: {str(e)}"



@tool
def scrape_tool(url:str)->str:
    """
    this tool scrape the impotant information from the webpage and return the text content of the page.
    """

    try:
        response = requests.get(url , timeout=8 , headers = {'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(response.content, 'html.parser')
        # Remove script and style elements
        for script in soup(["script", "style" , "nav" , "footer"]):
            script.decompose()  # Remove these tags
            return soup.get_text(separotor="\n" , strip = True )[:3000]

    except Exception as e:
        return f" an error occured while scraping the webpage: {str(e)}"


# if __name__== "__main__":
#     result = web_tool.invoke({
#     "goal": "I want to become an AI Engineer",
#     "current_level": "Beginner",
#     "target_timeline":"6 months",
# })

# print(result)