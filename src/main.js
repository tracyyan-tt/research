import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPLYReader from '@kitware/vtk.js/IO/Geometry/PLYReader';
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';

// Create a full-screen render window
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// Set up file input
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.ply,.vtk';
document.body.appendChild(fileInput);

// Function to handle PLY files
function handlePlyFile(file) {
    const reader = vtkPLYReader.newInstance();
    const fileReader = new FileReader();

    fileReader.onload = () => {
        reader.parseAsArrayBuffer(fileReader.result);
        const mapper = vtkMapper.newInstance();
        const actor = vtkActor.newInstance();
        
        actor.setMapper(mapper);
        mapper.setInputConnection(reader.getOutputPort());
        renderer.addActor(actor);
        renderer.resetCamera();
        renderWindow.render();
    };
    fileReader.readAsArrayBuffer(file);
}

// Function to handle VTK files
function handleVtkFile(file) {
    const reader = vtkPolyDataReader.newInstance();
    const fileReader = new FileReader();

    fileReader.onload = () => {
        reader.parseAsArrayBuffer(fileReader.result);
        const polydata = reader.getOutputData(0);
        const mapper = vtkMapper.newInstance();
        const actor = vtkActor.newInstance();

        actor.setMapper(mapper);
        mapper.setInputData(polydata);
        renderer.addActor(actor);
        renderer.resetCamera();
        renderWindow.render();
    };
    fileReader.readAsArrayBuffer(file);
}

// Handle file input change
fileInput.addEventListener('change', (event) => {
    const files = event.target.files;
    if (files.length > 0) {
        const file = files[0];
        const name = file.name.toLowerCase();
        if (name.endsWith('.ply')) {
            handlePlyFile(file);
        } else if (name.endsWith('.vtk')) {
            handleVtkFile(file);
        }
    }
});




