import re

file_path = 'src/app/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Step 1: Fix Step 1 (Nota Geral)
s1_old = '''                <button
                  disabled={isProcessing}
                  onClick={() => handleExperience(item.label)}
                  className={lex-1 w-full flex flex-col items-center justify-center p-8 md:p-14 min-h-[60px] rounded-3xl border-2 transition-all transform hover:scale-105 active:scale-95  disabled:opacity-50}
                >
                  <span className="text-6xl md:text-8xl mb-6">{item.emoji}</span>
                  <span className="text-xl md:text-3xl font-semibold">{item.label}</span>
                </button>'''

s1_new = '''                <button
                  disabled={isProcessing}
                  onClick={() => handleExperience(item.label)}
                  className={cursor-pointer flex-1 w-full flex flex-col items-center justify-center p-8 md:p-14 min-h-[60px] rounded-3xl border-2 transition-all transform hover:scale-105 active:scale-95  disabled:opacity-50}
                >
                  <span className="text-6xl md:text-8xl mb-6 pointer-events-none">{item.emoji}</span>
                  <span className="text-xl md:text-3xl font-semibold pointer-events-none">{item.label}</span>
                </button>'''
content = content.replace(s1_old, s1_new)

# Step 2: Fix Step 2 (Aula Coletiva)
s2_old = '''            <button
              disabled={isProcessing}
              onClick={() => handleAulaColetiva(false)}
              className="flex-1 flex flex-col items-center justify-center space-y-4 py-10 px-8 min-h-[140px] rounded-3xl border-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 text-zinc-300 text-2xl font-bold transition-all transform active:scale-95 disabled:opacity-50"
            >
              <span className="text-5xl">❌</span>
              NÃO
            </button>
            <button
              disabled={isProcessing}
              onClick={() => handleAulaColetiva(true)}
              className="flex-1 flex flex-col items-center justify-center space-y-4 py-10 px-8 min-h-[140px] rounded-3xl border-2 bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30 text-purple-300 text-2xl font-bold transition-all transform active:scale-95 disabled:opacity-50"
            >
              <span className="text-5xl">✅</span>
              SIM
            </button>'''

s2_new = '''            <button
              disabled={isProcessing}
              onClick={() => handleAulaColetiva(false)}
              className="cursor-pointer flex-1 flex flex-col items-center justify-center space-y-4 py-10 px-8 min-h-[140px] rounded-3xl border-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 text-zinc-300 text-2xl font-bold transition-all transform active:scale-95 disabled:opacity-50"
            >
              <span className="text-5xl pointer-events-none">❌</span>
              <span className="pointer-events-none">NÃO</span>
            </button>
            <button
              disabled={isProcessing}
              onClick={() => handleAulaColetiva(true)}
              className="cursor-pointer flex-1 flex flex-col items-center justify-center space-y-4 py-10 px-8 min-h-[140px] rounded-3xl border-2 bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30 text-purple-300 text-2xl font-bold transition-all transform active:scale-95 disabled:opacity-50"
            >
              <span className="text-5xl pointer-events-none">✅</span>
              <span className="pointer-events-none">SIM</span>
            </button>'''
content = content.replace(s2_old, s2_new)

# Step 6, 8, 12: Add pointer-events-none to the inner tags of "Ninguém me atendeu" / "Não vi a limpeza" and add cursor-pointer to the button
def fix_fallback_buttons(text):
    # Regex to match the fallback button
    pattern = r'(<button[^>]+className="[^"]*)(flex-shrink-0 snap-center flex flex-col items-center justify-center[^"]+)("[^>]*>\s*<div[^>]*>\s*<span className=")([^"]+)(")(>\s*[^\s<]+.*?</span>\s*</div>\s*<h2 className=")([^"]+)(")([^>]*>.*?</h2>\s*<p className=")([^"]+)(")([^>]*>.*?</p>\s*</button>)'
    
    def replacer(match):
        c1 = match.group(1)
        if "cursor-pointer" not in c1:
            c1 += "cursor-pointer "
        
        c2 = match.group(2)
        c3 = match.group(3)
        span_cls = match.group(4)
        if "pointer-events-none" not in span_cls:
            span_cls += " pointer-events-none"
        
        c5 = match.group(5)
        c6 = match.group(6)
        h2_cls = match.group(7)
        if "pointer-events-none" not in h2_cls:
            h2_cls += " pointer-events-none"
            
        c8 = match.group(8)
        c9 = match.group(9)
        p_cls = match.group(10)
        if "pointer-events-none" not in p_cls:
            p_cls += " pointer-events-none"
            
        c11 = match.group(11)
        c12 = match.group(12)
        
        return c1 + c2 + c3 + span_cls + c5 + c6 + h2_cls + c8 + c9 + p_cls + c11 + c12

    return re.sub(pattern, replacer, text, flags=re.DOTALL)

content = fix_fallback_buttons(content)

# We should also ensure cursor-pointer is added to standard receptionist/professor/cleaning staff buttons
def fix_staff_buttons(text):
    pattern = r'(<button[^>]+className="[^"]*)(flex-shrink-0 snap-center flex flex-col items-center p-6[^"]+)("[^>]*>)'
    def replacer(match):
        c1 = match.group(1)
        if "cursor-pointer" not in c1:
            c1 += "cursor-pointer "
        return c1 + match.group(2) + match.group(3)
    return re.sub(pattern, replacer, text, flags=re.DOTALL)

content = fix_staff_buttons(content)

# We should also ensure pointer-events-none is on h2 and p inside the staff buttons
def fix_staff_inner(text):
    pattern = r'(<h2 className="text-2xl font-bold)(")(>.*?</h2>\s*<p className=")([^"]+)(")([^>]*>.*?</p>)'
    def replacer(match):
        c1 = match.group(1)
        if "pointer-events-none" not in c1:
            c1 += " pointer-events-none"
        c3 = match.group(3)
        c4 = match.group(4)
        if "pointer-events-none" not in c4:
            c4 += " pointer-events-none"
        return c1 + match.group(2) + c3 + c4 + match.group(5) + match.group(6)
    return re.sub(pattern, replacer, text, flags=re.DOTALL)

content = fix_staff_inner(content)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("File successfully processed.")
