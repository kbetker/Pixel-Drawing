import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { dispatchSelectedColor } from "../../store/pixelDrawing"
import "./PixelCanvas.css"
import transparent2 from "./transparent2.png"
// import paintCursor from "./paintCursor.png"
import cursor2 from "./cursor2.png"
import colorPicker from "./colorPicker.png"
import bucketFill from "./bucketFill.png"

function PixelCanvas() {
    const dispatch = useDispatch()
    const selectedColor = useSelector(state => state.pixelDrawing.selectedColor)
    const isMouseDown = useSelector(state => state.pixelDrawing.mouseDown)
    const whatKeyPressed = useSelector(state => state.pixelDrawing.keyPressed)
    const [currentCanvas, setCurrentCanvas] = useState([])
    const [editMode, setEditMode] = useState("drawingMode")
    const [undo, setUndo] = useState([[]])
    const [redo, setRedo] = useState([])
    const arrayBg = "rgba(0, 0, 0, 0)"
    const pixel = 14
    const rows = 40
    const columns = 40


    // ======================   Listens for keypress   ======================
    useEffect(()=>{
        if (whatKeyPressed.key === "d") {
            setEditMode('drawingMode')
        } else if (whatKeyPressed.key === "f") {
            setEditMode('fillMode')
        } else if (whatKeyPressed.key === "c") {
            setEditMode('colorPicker')
        } else if (whatKeyPressed.ctrlKey && whatKeyPressed.key === "z") {
            handleUndo()
        } else if (whatKeyPressed.ctrlKey && whatKeyPressed.key === "y") {
            handleRedo()
        }

    }, [whatKeyPressed])


    // ======================   initializes array to transparent background   ======================
    const initArray = () => {
        let rowsArr = []
        let columnsArr = []
        for (let i = 0; i < rows; i++) { rowsArr.push(arrayBg) }
        for (let j = 0; j < columns; j++) { columnsArr.push(rowsArr) }
        return columnsArr
    }

    //======================   sets currentCanvas to initial array and initializes first color   ======================
    useEffect(() => {
        setCurrentCanvas(initArray())
        dispatch(dispatchSelectedColor("rgba(0, 0, 0, 1.00)"))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    //======================  converts to rgba if not already  ======================
    function convertToRGBA(color) {
        if (!color.startsWith("rgba")) {
            let first = color.slice(0, 3)
            let mid = color.slice(color.indexOf("("), color.indexOf(")"))
            return `${first}a${mid}, 1.00)`
        } else {
            return color
        }
    }

    //======================   fill function helper   ======================
    function fillColorRecurs(row, column, currBgColor, newArr) {
        //=== edge cases and base case ===
        if (row === null
            || column === null
            || newArr[row][column] !== currBgColor
            || selectedColor === currBgColor
        ) return newArr;


        newArr[row][column] = selectedColor
        let up = row - 1 >= 0 ? row - 1 : null
        let down = row + 1 < newArr.length ? row + 1 : null
        let left = column - 1 >= 0 ? column - 1 : null
        let right = column + 1 < newArr[row].length ? column + 1 : null

        fillColorRecurs(up, column, currBgColor, newArr)
        fillColorRecurs(down, column, currBgColor, newArr)
        fillColorRecurs(row, left, currBgColor, newArr)
        fillColorRecurs(row, right, currBgColor, newArr)
        return newArr
    }

    //======================  helper function to DRY up the code a bit  ======================
    function draw_fill_helper(){
        //=== resets redo history ===
        setRedo([])

        //=== retruns a copy of the  array ===
        let newArr = []
        for (var i = 0; i < currentCanvas.length; i++) {
            newArr[i] = currentCanvas[i].slice();
        }
        return newArr
    }


    //======================  fill function   ======================
    function fillFunc(row, column, currBgColor) {
        //=== calls helper function ===
        setCurrentCanvas(fillColorRecurs(row, column, currBgColor, draw_fill_helper()))
    }


    //======================   change bgColor when drawing   ======================
    function changeColor(row, column) {
        let newArr = draw_fill_helper()
        //=== changes value then set the currentCanvas ===
        newArr[row][column] = selectedColor
        setCurrentCanvas(newArr)
    }


    //======================   Records History   ======================
    function handleHistory() {
        if (undo.length >= 30) {
            let newArr = []
            for (let i = 1; i < undo.length; i++) {
                newArr.push(undo[i]);
            }
            newArr.push(currentCanvas)
            setUndo(newArr)

        } else {
            setUndo(oldUndo => [...oldUndo, currentCanvas])
        }
    }

    //====================== Undo ======================
    function handleUndo() {
        if (undo.length <= 1) { console.log("End of History"); return }
        let pop = undo.pop()
        setRedo(oldRedo => [...oldRedo, currentCanvas])
        setCurrentCanvas(pop)
    }

    //====================== Redo ======================
    function handleRedo() {
        if (redo.length === 0) { console.log("End of History"); return }
        let pop = redo.pop();
        setUndo(oldRedo => [...oldRedo, currentCanvas])
        setCurrentCanvas(pop)
    }

    //====================== Clears Canvas ======================
    function clearCanvas() {
        setUndo(oldUndo => [...oldUndo, currentCanvas])
        setCurrentCanvas(initArray())
    }

    return (
        <>
            <div className="editButtons" >
                <button onClick={() => setEditMode('drawingMode')}>&#40;D&#41;raw Mode</button>
                <button onClick={() => setEditMode('fillMode')}>&#40;F&#41;ill Mode</button>
                <button onClick={() => setEditMode('colorPicker')}>&#40;C&#41;olor Picker</button>
                <button onClick={() => clearCanvas()}>Clear Canvas</button>
                <button onClick={() => handleUndo()}>Undo</button>
                <button onClick={() => handleRedo()}>Redo</button>
                <span style={{ color: "white", marginLeft: "10px" }}>{editMode}</span>
            </div>

            <div
                className="canvas"
                style={{
                    width: `${rows * pixel}px`,
                    height: `${columns * pixel}px`,
                    backgroundImage: `url(${transparent2})`,
                    cursor:
                        editMode === 'drawingMode' ? `url( ${cursor2}) 10 10, auto`
                            : editMode === 'colorPicker' ? `url( ${colorPicker}) 0 20, auto`
                                : editMode === "fillMode" && `url( ${bucketFill}) 0 20, auto`
                }}
                onMouseDown={() =>
                    (editMode === 'drawingMode' || editMode === "fillMode") && handleHistory
                }

            >
                {currentCanvas.map((e, i) =>
                    e.map((e2, j) =>
                        <div
                            className="pixel"
                            id={`${i}-${j}`}
                            key={`key-${i}-${j}`}
                            style={{
                                height: `${pixel}px`,
                                width: `${pixel}px`,
                                backgroundColor: currentCanvas[i][j]
                            }}
                            onMouseDown={(e) => [
                                handleHistory(),
                                editMode === "drawingMode" && changeColor(i, j),
                                editMode === "fillMode" && fillFunc(i, j, convertToRGBA(e.target.style.backgroundColor)),
                                editMode === "colorPicker" && dispatch(dispatchSelectedColor(convertToRGBA(e.target.style.backgroundColor))),
                            ]}

                            onMouseOver={() =>
                                isMouseDown && editMode === "drawingMode" && changeColor(i, j)
                            }
                        >
                        </div>
                    )
                )}
            </div>
        </>
    )
}

export default PixelCanvas






    //DON'T DELETE - this will allow you to continue editing a saved picture
    // useEffect(() => {
    //     let pixelBg = document.querySelectorAll(`.pixel`)
    //     for (let i = 0; i < pixelBg.length; i++) {
    //         let arr = pixelBg[i].id.split("-")
    //         pixelBg[i].style.backgroundColor = `${currentCanvas[arr[0]][arr[1]]}`
    //     }
    // }, [])
