from docx import Document
import os
path = r'C:/Users/Acer/Downloads/ProjectPulse_Dissertation_Final.docx'
print('exists', os.path.exists(path))
doc = Document(path)
for i, para in enumerate(doc.paragraphs[:20], 1):
    print(f"{i}: {para.text}")
