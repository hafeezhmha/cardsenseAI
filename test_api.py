import requests
import json

# The URL of your API endpoint
API_URL = "https://cardsense-ai.vercel.app/api/query"

def test_api_endpoint(question, chat_history=None):
    """
    Tests the API endpoint with a given question and optional chat history.

    Args:
        question (str): The question to send to the API.
        chat_history (list, optional): A list of message objects representing
                                       the chat history. Defaults to None.
                                       Example: [
                                           {"role": "user", "content": "Tell me about credit cards."},
                                           {"role": "assistant", "content": "Credit cards are payment tools..."}
                                       ]
    """
    print(f"\n--- Testing with Question: '{question}' ---")
    if chat_history:
        print(f"Chat History: {json.dumps(chat_history, indent=2)}")

    messages = []
    if chat_history:
        messages.extend(chat_history)
    messages.append({"role": "user", "content": question})

    payload = {
        "messages": messages
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=60) # Added timeout

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            try:
                response_data = response.json()
                print("Response JSON:")
                print(json.dumps(response_data, indent=2))

                if "answer" in response_data:
                    print(f"\nAnswer from AI: {response_data['answer']}")
                if "sources" in response_data and response_data["sources"]:
                    print("\nSources:")
                    for i, source in enumerate(response_data["sources"]):
                        print(f"  Source {i+1}:")
                        print(f"    Content: {source.get('content', 'N/A')[:100]}...") # Print first 100 chars
                        print(f"    URL: {source.get('url', 'N/A')}")
                elif "sources" in response_data and not response_data["sources"]:
                     print("\nSources: No sources returned.")

            except json.JSONDecodeError:
                print("Error: Failed to decode JSON response.")
                print(f"Response Text: {response.text}")
        else:
            print("Error: API request failed.")
            try:
                error_data = response.json()
                print("Error Response JSON:")
                print(json.dumps(error_data, indent=2))
            except json.JSONDecodeError:
                print(f"Error Response Text: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"Error: Request failed: {e}")

if __name__ == "__main__":
    # Test Case 1: Simple question without history
    test_api_endpoint("What are the benefits of the Pixel Play Card?")

    # Test Case 2: Question with chat history
    history = [
        {"role": "user", "content": "Can you tell me about the features of the NovaSpark credit card?"},
        {"role": "assistant", "content": "The NovaSpark card offers 2% cashback on all purchases and no annual fee."}
    ]
    test_api_endpoint("Does it have any travel insurance benefits?", chat_history=history)

    # Test Case 3: A question that might not have direct data (to test NO_DATA or similar handling if implemented)
    # test_api_endpoint("What's the best recipe for apple pie?")

    # Test Case 4: A question that might require history to make sense
    history_for_ambiguous = [
         {"role": "user", "content": "I'm looking at the Aurora Advantage card."}
    ]
    test_api_endpoint("What are its fees?", chat_history=history_for_ambiguous)