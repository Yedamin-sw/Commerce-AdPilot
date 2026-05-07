#ai를 사용하는 작업은 여기서 진행(프롬프트)
from openai import AsyncOpenAI
import os

client = AsyncOpenAI(api_key = os.getenv("OPEAI_API_KEY"))

async def test():
    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello! How can you assist me today?"}
        ]
    )
    print(response.choices[0].message.content)
    
#프롬프트를 받아와서 실행
async def generate_ad(prompt: str):
    try:
        response = await client.completions.create(
            model="gpt-3.5-turbo",
            prompt=prompt
        )
        return True, response.choices[0].text
    except Exception as e:
        print(f"Error generating ad: {e}")
        return False, "Error generating ad."