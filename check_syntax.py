import sys
import esprima

try:
    with open('main_v130.js', 'r', encoding='utf-8') as f:
        code = f.read()
    esprima.parseScript(code)
    print("Syntax OK")
except Exception as e:
    print("Syntax Error:", e)
