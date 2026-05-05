from pathlib import Path
import shutil

from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma


load_dotenv()

DATA_DIR = Path("data")
DB_DIR = "chroma_db"


def find_pdf_file():
    pdf_files = list(DATA_DIR.glob("*.pdf"))

    if not pdf_files:
        raise FileNotFoundError("data 폴더 안에 PDF 파일이 없습니다.")

    return pdf_files[0]


def main():
    pdf_path = find_pdf_file()
    print(f"PDF 파일 읽는 중: {pdf_path}")

    # 1. PDF 문서 불러오기
    loader = PyPDFLoader(str(pdf_path))

    # 2. 페이지별 텍스트 추출
    documents = loader.load()

    print(f"PDF 페이지 수: {len(documents)}")

    # 3. chunk 단위 분할
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150
    )

    split_docs = text_splitter.split_documents(documents)

    print(f"분할된 문서 조각 수: {len(split_docs)}")

    print("\n첫 번째 문서 조각 미리보기")
    print("-" * 50)
    print(split_docs[0].page_content[:500])
    print("-" * 50)

    # 기존 Chroma DB가 있으면 삭제 후 새로 생성
    if Path(DB_DIR).exists():
        shutil.rmtree(DB_DIR)
        print(f"\n기존 {DB_DIR} 폴더 삭제 완료")

    # 4. 문서 조각을 임베딩으로 변환할 준비
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small"
    )

    # 5. Chroma 벡터DB에 저장
    vectorstore = Chroma.from_documents(
        documents=split_docs,
        embedding=embeddings,
        persist_directory=DB_DIR,
        collection_name="seoul_life_guide"
    )

    print("\nChroma 벡터DB 저장 완료!")
    print(f"저장 위치: {DB_DIR}")


if __name__ == "__main__":
    main()