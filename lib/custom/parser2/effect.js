
export default function handleEffect(effect) {

    const match = effect.match(/^\s*(\S+)/);

    const typeofEffect = match[1].toUpperCase()
    console.log(typeofEffect);
    switch (typeofEffect) {
        case 'INSERT':
            return handleInsert(effect);
        case 'UPDATE':
            return handleUpdate(effect);
        case 'DELETE':
            return handleDelete(effect);
        default:
            throw new Error(`Unknown effect type: ${typeofEffect}`);
    }


}



function handleInsert(effect) {
    console.log("this is an insert");
}
function handleUpdate(effect) {
    console.log("this is an update");
}
function handleDelete(effect) {
    console.log("this is a delete");
}