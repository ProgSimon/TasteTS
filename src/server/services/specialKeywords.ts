const specialKeywordsList = {
    english: {
        ignored: ["and", "or", "the", "a", "an", "of", "in", "on", "for", "to", "from", "by", "at", "as", "is", "are"],
        included: ["with", "including", "includes", "include", "contain", "contains", "containing"],
        excluded: ["without", "excluding", "excludes", "exclude", "lack", "lacks", "lacking", "no"]
    },
    polish: {
        ignored: ["i", "lub", "oraz", "na", "w", "do", "od", "przez", "u", "jako", "jest", "są"],
        included: ["z", "wraz", "łącznie", "zawiera", "zawierają", "zawierające", "zawierający"],
        excluded: ["bez", "nie zawierające", "nie zawiera", "nie zawierają", "brak", "nie ma"]
    }
}

const specialKeywords = {
    ignore: new Set([...specialKeywordsList.english.ignored, ...specialKeywordsList.polish.ignored]),
    control: {
        include: new Set([...specialKeywordsList.english.included, ...specialKeywordsList.polish.included]),
        exclude: new Set([...specialKeywordsList.english.excluded, ...specialKeywordsList.polish.excluded])
    }
}

export default specialKeywords;