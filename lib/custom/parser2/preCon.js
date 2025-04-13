
export default function handlePreCon(Precon) {

    // const regex = /(?<=\s|^)([a-zA-Z_]\w*)(?=\s*[\+\-\*\/\%\(\)\&\|\!\=\>\<\?\:\;\,\.\[\]\{\}\^\~\$\#\@\`\']|$)/g
    const regex = /(?<=\s|^)([a-zA-Z_]\w*)(?=\s*[\+\-\*\/\%\(\)\&\|\!\=\>\<\?\:\;\,\.\[\]\{\}\^\~\$\#\@\`\']|$)/g
    return regex


}