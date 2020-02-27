import json
import re
import spacy

nlp = spacy.load("en_core_web_sm")


def get_meta(data):
    total_beds = 0
    total_baths = 0
    total_sqft = 0
    total_price = 0
    total_hoa = 0

    total = len(data)

    for d in data:
        if d["beds"] < 10:
            total_beds += d["beds"]
        if d["baths"] < 10:
            total_baths += d["baths"]
        if d["size"] < 10000:
            total_sqft += d["size"]
        total_price += d["price"]
        total_hoa += d.get("hoa", 0)

    print("beds {:,}".format(total_beds))
    print("baths {:,}".format(total_baths))
    print("sqft {:,}".format(total_sqft))
    print("price {:,}".format(total_price))
    print("hoa {:,}".format(total_hoa))

    print("avg beds {:,}".format(total_beds / total))
    print("avg baths {:,}".format(total_baths / total))
    print("avg sqft {:,}".format(int(total_sqft / total)))
    print("avg price {:,}".format(int(total_price / total)))
    print("avg hoa {:,}".format(int(total_hoa / total)))
    print("prc/ft {:,}".format(total_price / total_sqft))

    return {
        "beds": total_beds,
        "baths": total_baths,
        "sqft": total_sqft,
        "price": total_price,
        "hoa": total_hoa
    }


def pos_regex_matches(doc, pattern, search_type="tag"):
    """
    Extract sequences of consecutive tokens from a spacy-parsed doc whose
    part-of-speech tags match the specified regex pattern.

    Args:
        doc (``textacy.Doc`` or ``spacy.Doc`` or ``spacy.Span``)
        pattern (str): Pattern of consecutive POS tags whose corresponding words
            are to be extracted, inspired by the regex patterns used in NLTK's
            `nltk.chunk.regexp`. Tags are uppercase, from the universal tag set;
            delimited by < and >, which are basically converted to parentheses
            with spaces as needed to correctly extract matching word sequences;
            white space in the input doesn't matter.

            Examples (see ``constants.POS_REGEX_PATTERNS``):

            * noun phrase: r'<DET>? (<NOUN>+ <ADP|CONJ>)* <NOUN>+'
            * compound nouns: r'<NOUN>+'
            * verb phrase: r'<VERB>?<ADV>*<VERB>+'
            * prepositional phrase: r'<PREP> <DET>? (<NOUN>+<ADP>)* <NOUN>+'

    Yields:
        ``spacy.Span``: the next span of consecutive tokens from ``doc`` whose
            parts-of-speech match ``pattern``, in order of apperance
    """
    # standardize and transform the regular expression pattern...
    pattern = re.sub(r"\s", "", pattern)
    pattern = re.sub(r"<([A-Z]+)\|([A-Z]+)>", r"( (\1|\2))", pattern)
    pattern = re.sub(r"<([A-Z]+)>", r"( \1)", pattern)

    if search_type == "pos":
        tags = " " + " ".join(tok.pos_ for tok in doc)
    else:
        tags = " " + " ".join(tok.tag_ for tok in doc)

    for m in re.finditer(pattern, tags):
        yield doc[tags[0 : m.start()].count(" ") : tags[0 : m.end()].count(" ")]


def get_pattern(data, pat):
    for d in data:
        descrip = d.get("description", "")
        doc = nlp(descrip)
        matches = pos_regex_matches(doc, pat)
        for m in matches:
            print(m)


def show_pos(text):
    doc = nlp(text)
    for t in doc:
        print(t, t.pos_, t.tag_)


def description_sentences(data):
    for d in data:
        description = d.get("description", "")
        doc = nlp(description)
        for s in doc.sents:
            print(s)


if __name__ == "__main__":
    # DATA = "../data/all_apartments.json"
    # DATA = "../../new-york-apartment/all_apartments.json"
    DATA = "all_apartments.json"
    with open(DATA, "r") as infile:
        data = json.load(infile)

    get_meta(data)
    # description_sentences(data)
    # get_pattern(data, r'<DT> <NN> <VBZ> <JJ>') # the blank is blank
    # get_pattern(data, r'<VB> <JJ>')
    # get_pattern(data, r'<VB> <RB>')

    # show_pos("")
