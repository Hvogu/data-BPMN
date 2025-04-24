
export default function getTextBoxes(container) {


    const div = document.createElement('div')
    const sqlEditor = document.createElement('textarea'); sqlEditor.id = container.id + 'sql'
    sqlEditor.className = 'sql'
    container.sqlEditor = sqlEditor;
    div.appendChild(sqlEditor);

    container.appendChild(div)
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
}