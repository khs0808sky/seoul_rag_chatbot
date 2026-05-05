from pathlib import Path

from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma


load_dotenv()

DB_DIR = "chroma_db"
COLLECTION_NAME = "seoul_life_guide"


def load_vectorstore():
    """
    저장해둔 ChromaDB를 다시 불러오는 함수
    """
    if not Path(DB_DIR).exists():
        raise FileNotFoundError(
            "chroma_db 폴더가 없습니다. 먼저 python build_db.py를 실행해 주세요."
        )

    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small"
    )

    vectorstore = Chroma(
        persist_directory=DB_DIR,
        embedding_function=embeddings,
        collection_name=COLLECTION_NAME
    )

    return vectorstore


def create_answer(question, docs):
    """
    검색된 문서 조각을 참고해서 LLM 답변을 생성하는 함수
    """
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0
    )

    context = "\n\n".join([doc.page_content for doc in docs])

    prompt = f"""
너는 '서울 생활 가이드 PDF'를 바탕으로 답변하는 RAG 챗봇이야.

아래 참고 문서 내용만 바탕으로 답변해줘.
문서에 없는 내용은 추측하지 말고, "제공된 문서에서 확인하기 어렵습니다."라고 말해줘.
답변은 한국어로 쉽고 친절하게 작성해줘.

[참고 문서]
{context}

[사용자 질문]
{question}
"""

    response = llm.invoke(prompt)

    return response.content


def ask_question(question):
    """
    질문을 받아서 관련 문서를 검색하고 최종 답변을 반환하는 함수
    나중에 FastAPI 웹 서버에서도 이 함수를 재사용할 수 있음
    """
    vectorstore = load_vectorstore()

    docs = vectorstore.similarity_search(
        question,
        k=3
    )

    answer = create_answer(question, docs)

    sources = []
    for doc in docs:
        page = doc.metadata.get("page", "알 수 없음")

        if isinstance(page, int):
            page = page + 1

        sources.append({
            "page": page,
            "content": doc.page_content[:200]
        })

    return {
        "question": question,
        "answer": answer,
        "sources": sources
    }


def main():
    print("서울 생활 가이드 RAG 챗봇")
    print("종료하려면 exit 또는 quit 입력")
    print("-" * 50)

    while True:
        question = input("\n질문을 입력하세요: ")

        if question.lower() in ["exit", "quit"]:
            print("챗봇을 종료합니다.")
            break

        result = ask_question(question)

        print("\n답변")
        print(result["answer"])

        print("\n참고한 문서 조각")
        for i, source in enumerate(result["sources"], start=1):
            print(f"{i}. PDF 페이지: {source['page']}")
            print(f"   미리보기: {source['content']}...")
            print()


if __name__ == "__main__":
    main()