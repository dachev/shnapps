import nltk.data
import string
import re
import os

leadingRe  = re.compile('^[0-9 %s]*' % re.escape(string.punctuation));
trailingRe = re.compile('[0-9 %s]*$' % re.escape(string.punctuation));
tokenizer  = nltk.data.load('tokenizers/punkt/english.pickle')
file       = open(os.path.dirname(__file__) + '/../data/articles.txt')
data       = file.read()

for token in tokenizer.tokenize(data):
    token = leadingRe.sub('', token)
    token = trailingRe.sub('', token)
    print token
