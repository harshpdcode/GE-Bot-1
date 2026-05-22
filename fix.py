import codecs

try:
    with open('c:/Users/harsh/OneDrive/Desktop/MEO VB1/frontend/dashboard.html', 'r', encoding='utf-8') as f:
        text = f.read()

    # encode as cp1252 ignoring errors (this reverses the utf8 -> cp1252 mix up)
    bytes_data = text.encode('cp1252', errors='ignore')
    # decode back as utf-8
    fixed_text = bytes_data.decode('utf-8', errors='ignore')
    
    with open('c:/Users/harsh/OneDrive/Desktop/MEO VB1/frontend/dashboard.html', 'w', encoding='utf-8') as f:
        f.write(fixed_text)
    print('Mojibake reversed. File size is', len(fixed_text))
except Exception as e:
    print('Failed:', e)
