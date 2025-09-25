const gameBoard = document.querySelector('#gameboard');
const playerDisplay = document.querySelector('#player');
const infoDisplay = document.querySelector('#info-display');

const width = 8;
let playerGo = 'white';
playerDisplay.textContent = playerGo;


// Initial board setup
const startPieces = [
    rook, knight, bishop, queen, king, bishop, knight, rook,
    pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn,
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    pawn, pawn, pawn, pawn, pawn, pawn, pawn, pawn,
    rook, knight, bishop, queen, king, bishop, knight, rook
];

function createBoard() {
    startPieces.forEach((startPiece, i) => {
        const square = document.createElement('div');
        square.classList.add('square');
        square.innerHTML = startPiece;
        square.firstChild?.setAttribute('draggable', true);
        square.setAttribute('square-id', i);

        const row = Math.floor(i / width);
        if ((row + i) % 2 === 0) square.classList.add('beige');
        else square.classList.add('brown');

        if (i < 16 && square.firstChild) square.firstChild.classList.add('black-piece');
        if (i >= 48 && square.firstChild) square.firstChild.classList.add('white-piece');

        gameBoard.append(square);
    });
}

createBoard();

const allSquares = document.querySelectorAll('.square');

allSquares.forEach(square => {
    square.addEventListener('dragstart', dragStart);
    square.addEventListener('dragover', dragOver);
    square.addEventListener('drop', dragDrop);
});

let startPositionId;
let draggedPiece;

function dragStart(e) {
    startPositionId = e.target.parentNode.getAttribute('square-id');
    draggedPiece = e.target;
}

function dragOver(e) {
    e.preventDefault();
}

function dragDrop(e) {
    e.stopPropagation();
    const targetSquare = e.currentTarget;
    const targetPiece = targetSquare.querySelector('.piece');
    const valid = checkIfValid(targetSquare);

    const correctGo = draggedPiece.classList.contains(`${playerGo}-piece`);
    const opponentGo = playerGo === 'white' ? 'black' : 'white';

    if (!correctGo) {
        infoDisplay.textContent = "It's not your turn!";
        setTimeout(() => infoDisplay.textContent = '', 2000);
        return;
    }

    if (targetPiece) {
        if (targetPiece.classList.contains(`${opponentGo}-piece`) && valid) {
            targetPiece.remove();
            targetSquare.appendChild(draggedPiece);
            if (draggedPiece.id === 'pawn') draggedPiece.dataset.hasMoved = true;
            changePlayer();
            return;
        } else {
            infoDisplay.textContent = "You cannot go here";
            setTimeout(() => infoDisplay.textContent = '', 2000);
            return;
        }
    }

    if (valid) {
            targetSquare.appendChild(draggedPiece);
        if (draggedPiece.id === 'pawn') {
            draggedPiece.dataset.hasMoved = true;
            const targetRow = Math.floor(targetSquare.getAttribute('square-id') / width);
            checkPawnPromotion(draggedPiece, targetRow);
    }
    changePlayer();
}
}

function changePlayer() {
    playerGo = playerGo === 'white' ? 'black' : 'white';
    playerDisplay.textContent = playerGo;
}

// Move Validation
function checkIfValid(target) {
    const targetId = Number(target.getAttribute('square-id'));
    const startId = Number(startPositionId);
    const piece = draggedPiece.id;

    const startRow = Math.floor(startId / width);
    const startCol = startId % width;
    const targetRow = Math.floor(targetId / width);
    const targetCol = targetId % width;

    const rowDiff = targetRow - startRow;
    const colDiff = targetCol - startCol;

    const isWhite = draggedPiece.classList.contains('white-piece');
    const opponentClass = isWhite ? 'black-piece' : 'white-piece';
    const direction = isWhite ? -1 : 1;

    switch (piece) {
        case 'pawn':
            // Single move forward
            if (colDiff === 0 && rowDiff === direction && !target.firstChild) return true;

            // Double move forward
            const squareInFront = gameBoard.children[startId + direction * width];
            if (colDiff === 0 && rowDiff === 2 * direction &&
                !target.firstChild && squareInFront && !squareInFront.firstChild &&
                !draggedPiece.dataset.hasMoved) return true;

            // Diagonal capture
            if (Math.abs(colDiff) === 1 && rowDiff === direction &&
                target.firstChild?.classList.contains(opponentClass)) return true;

            return false;

        case 'rook':
            if (rowDiff === 0 || colDiff === 0) return isPathClear(startId, targetId);
            return false;

        case 'bishop':
            if (Math.abs(rowDiff) === Math.abs(colDiff)) return isPathClear(startId, targetId);
            return false;

        case 'queen':
            if (rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === Math.abs(colDiff)) return isPathClear(startId, targetId);
            return false;

        case 'king':
            if (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1) return true;
            return false;

        case 'knight':
            if ((Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
                (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2)) return true;
            return false;

        default:
            return false;
    }
}

// Path Checking for Rook/Bishop/Queen
function isPathClear(startId, targetId) {
    const startRow = Math.floor(startId / width);
    const startCol = startId % width;
    const targetRow = Math.floor(targetId / width);
    const targetCol = targetId % width;

    const rowStep = targetRow === startRow ? 0 : (targetRow > startRow ? 1 : -1);
    const colStep = targetCol === startCol ? 0 : (targetCol > startCol ? 1 : -1);

    let currentRow = startRow + rowStep;
    let currentCol = startCol + colStep;

    while (currentRow !== targetRow || currentCol !== targetCol) {
        const id = currentRow * width + currentCol;
        if (gameBoard.children[id].firstChild) return false;
        currentRow += rowStep;
        currentCol += colStep;
    }

    return true;
}

//Pawn Promotion

function checkPawnPromotion(pawn, targetRow) {
    const isWhite = pawn.classList.contains('white-piece');

    if ((isWhite && targetRow === 0) || (!isWhite && targetRow === 7)) {
        const promotion = prompt('Promote pawn to (queen/rook/bishop/knight):', 'queen');
        let newPieceHTML = '';

        switch (promotion?.toLowerCase()) {
            case 'queen':
                newPieceHTML = queen;
                break;
            case 'rook':
                newPieceHTML = rook;
                break;
            case 'bishop':
                newPieceHTML = bishop;
                break;
            case 'knight':
                newPieceHTML = knight;
                break;
            default:
                newPieceHTML = queen;
        }

        // Replace the pawn with the new piece
        const parentSquare = pawn.parentNode;
        parentSquare.innerHTML = newPieceHTML;

        // Add the correct classes for color
        const newPiece = parentSquare.querySelector('.piece');
        if (isWhite) newPiece.classList.add('white-piece');
        else newPiece.classList.add('black-piece');

        // Make the new piece draggable
        newPiece.setAttribute('draggable', true);
        newPiece.addEventListener('dragstart', dragStart);
    }
}

