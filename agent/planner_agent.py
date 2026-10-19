
import re

from dotenv import load_dotenv
from langchain_ollama import ChatOllama

from tools.web_tool import web_tool, scrape_tool
from state.state import CareerPlannerState

load_dotenv()


def planner_agent(state: CareerPlannerState) -> dict:
    try:
        # 1. Run the web search tool
        web_search_result = web_tool.invoke({
            "goal": state.get("goal", ""),
            "current_level": state.get("current_level", ""),
            "target_timeline": state.get("target_timeline", ""),
            "preferences": state.get("preferences", ""),
        })

        # 2. Convert the search result into text
        web_result = (
            web_search_result
            if isinstance(web_search_result, str)
            else str(web_search_result)
        )

        # print("\n===== WEB TOOL OUTPUT =====")
        # print(web_result)
        print("===========================\n")

        # 3. Check for search errors
        if "An error occurred in web search" in web_result:
            return {
                "plan_result": web_result
            }

        # 4. Extract URLs only once
        urls = re.findall(
            r"URL:\s*(https?://[^\s]+)",
            web_result
        )

        # Remove trailing punctuation
        urls = [
            url.rstrip(".,;!?)\"'")
            for url in urls
        ]

        # Remove duplicate URLs
        urls = list(dict.fromkeys(urls))

        print("Extracted URLs:", urls)

        if not urls:
            return {
                "plan_result": (
                    "No URLs found in the web search results. "
                    "Check the web tool output above."
                )
            }

        # 5. Scrape the extracted URLs
        scrape_results = []

        for url in urls[:3]:
            try:
                result = scrape_tool.invoke({"url": url})

                if not result:
                    print(f"Failed to scrape content from: {url}")
                    continue

                # Convert non-string results into text
                if not isinstance(result, str):
                    result = str(result)

                scrape_results.append(
                    f"SOURCE_URL: {url}\n"
                    f"CONTENT: {result}"
                )

                print(f"Successfully scraped: {url}")

            except Exception as scrape_error:
                print(f"Scraping failed for {url}: {scrape_error}")

        # 6. Handle cases where URLs exist but scraping fails
        if not scrape_results:
            return {
                "plan_result": (
                    "Search returned URLs, but their content could "
                    "not be scraped. Check the scraper output and "
                    "the website's accessibility."
                )
            }

        scraped_content = "\n\n".join(scrape_results)

        # 7. Prepare the career-planning prompt
        prompt = f"""
You are an AI career planner.

Create a practical, detailed, and realistic career roadmap
based on the user's goals and the available research.

USER INFORMATION

Career goal:
{state.get("goal", "")}

Current level:
{state.get("current_level", "")}

Target timeline:
{state.get("target_timeline", "")}

Preferences:
{state.get("preferences", "")}

WEB SEARCH RESULTS:
{web_result}

SCRAPED WEBSITE CONTENT:
{scraped_content}

INSTRUCTIONS

1. Divide the roadmap into clear phases.
2. Recommend relevant skills, technologies, and projects.
3. Include practical milestones and suggested learning activities.
4. Respect the user's current level and target timeline.
5. Use the supplied search results and scraped content as evidence.
6. Do not invent facts or claim that a source supports something
   unless the supplied content actually supports it.
7. If the evidence is insufficient, clearly state the limitation.
8. Write in clear, concise, informative English.
9. Do not claim that the user will definitely get a job.
"""

        # 8. Generate the career plan using Ollama
        llm = ChatOllama(
            model="qwen2.5:7b",
            temperature=0.3
        )

        response = llm.invoke(prompt)

        # 9. Return the updated LangGraph state
        return {
            "plan_result": response.content
        }

    except Exception as e:
        return {
            "plan_result": f"An error occurred in the planner agent: {str(e)}"
        }


if __name__ == "__main__":
    test_state = {
        "goal": "Become an AI Engineer",
        "current_level": "Beginner",
        "target_timeline": "6 months",
        "preferences": (
            "Focus on Python, Machine Learning, and GenAI"
        )
    }

    result = planner_agent(test_state)

    print("\n===== CAREER PLAN =====\n")
    print(result.get("plan_result", "No career plan generated."))


					
            
 
        
        

    
				