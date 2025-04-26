
export default function getTextBoxes(container) {


    const div = document.createElement('div')
    const sqlEditor = document.createElement('textarea'); sqlEditor.id = container.id + 'sql'
    sqlEditor.className = 'sql'
    container.sqlEditor = sqlEditor;
    div.appendChild(sqlEditor);

    div.addEventListener('keydown', function(event) {
        if (event.target.tagName.toLowerCase() === 'textarea' && (event.key === ' ' || event.code === 'Space')) {
            event.stopPropagation();
        }
    });
    
    container.appendChild(div);
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
}