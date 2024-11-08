import React, { useEffect, useRef, useState } from 'react';
import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';
import vtkPLYReader from '@kitware/vtk.js/IO/Geometry/PLYReader';
import vtkPointPicker from '@kitware/vtk.js/Rendering/Core/PointPicker';

const App = () => {
  const vtkContainerRef = useRef(null);
  const context = useRef(null);
  const [fileType, setFileType] = useState('vtk');
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [edgeColor, setEdgeColor] = useState('#000000');
  const [opacity, setOpacity] = useState(0.5);

  useEffect(() => {
    if (!context.current) {
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        rootContainer: vtkContainerRef.current,
      });
      const renderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();
  
      context.current = {
        fullScreenRenderer,
        renderer,
        renderWindow,
        currentActor: null,
        picker: vtkPointPicker.newInstance(), // Initialize point picker
      };
  
      const handleRightButtonPress = (callData) => {
        if (renderer !== callData.pokedRenderer) return;
  
        const pos = callData.position;
        const point = [pos.x, pos.y, 0.0];
        context.current.picker.pick(point, renderer);
  
        const pickedActor = context.current.picker.getActors().length > 0 ? context.current.picker.getActors()[0] : null;
  
        if (pickedActor) {
          pickedActor.getProperty().setEdgeVisibility(true);
          pickedActor.getProperty().setEdgeColor(...hexToRGB(edgeColor));
          pickedActor.getProperty().setOpacity(opacity);
        } else if (context.current.currentActor) {
          context.current.currentActor.getProperty().setEdgeVisibility(false);
        }
  
        renderWindow.render();
      };
  
      renderWindow.getInteractor().onRightButtonPress(handleRightButtonPress);
    }
  }, [edgeColor, opacity, vtkContainerRef]);
  
  const clearCurrentActor = () => {
    const { currentActor, renderer, renderWindow } = context.current;
    if (currentActor) {
      renderer.removeActor(currentActor);
      currentActor.delete();
      context.current.currentActor = null;
      renderWindow.render();
    }
  };

  const loadVTKFile = (data) => {
    const { renderer, renderWindow } = context.current;
    clearCurrentActor();
    const reader = vtkPolyDataReader.newInstance();
    reader.parseAsArrayBuffer(data);

    const polydata = reader.getOutputData(0);
    if (!polydata) {
      console.error("No output data from the VTK reader.");
      return;
    }

    const mapper = vtkMapper.newInstance();
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    mapper.setInputData(polydata);

    actor.getProperty().setOpacity(opacity);

    renderer.addActor(actor);
    context.current.currentActor = actor;
    renderer.resetCamera();
    renderWindow.render();

    context.current.picker.addPickList(actor); // Add actor to picker
  };

  const loadPLYFile = (data) => {
    const { renderer, renderWindow } = context.current;
    clearCurrentActor();
    const reader = vtkPLYReader.newInstance();
    reader.parseAsArrayBuffer(data);

    const polydata = reader.getOutputData(0);
    if (!polydata) {
      console.error("No output data from the PLY reader.");
      return;
    }

    const mapper = vtkMapper.newInstance();
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    mapper.setInputData(polydata);

    actor.getProperty().setOpacity(opacity);

    renderer.addActor(actor);
    context.current.currentActor = actor;
    renderer.resetCamera();
    renderWindow.render();

    context.current.picker.addPickList(actor); // Add actor to picker
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setErrorMessage('');
  };

  const handleLoadFile = () => {
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if ((fileType === 'vtk' && fileExtension !== 'vtk') || (fileType === 'ply' && fileExtension !== 'ply')) {
      setErrorMessage(`Unmatching file type: Expected a .${fileType} file`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      if (fileType === 'vtk') {
        loadVTKFile(data);
      } else if (fileType === 'ply') {
        loadPLYFile(data);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleOpacityChange = (e) => {
    setOpacity(parseFloat(e.target.value));
    if (context.current.currentActor) {
      context.current.currentActor.getProperty().setOpacity(parseFloat(e.target.value));
      context.current.renderWindow.render();
    }
  };

  const hexToRGB = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r / 255, g / 255, b / 255];
  };
  const handleEdgeColorChange = (e) => {
    const rgb = e.target.value.match(/\w\w/g).map((x) => parseInt(x, 16) / 255);
    setEdgeColor(rgb);
    if (context.current.currentActor) {
      context.current.currentActor.getProperty().setEdgeColor(...rgb);
      context.current.renderWindow.render();
    }
  };
  return (
    <div>
      <div ref={vtkContainerRef} style={{ height: '100vh' }} />
      <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'white', padding: '10px' }}>
        <select onChange={(e) => setFileType(e.target.value)} value={fileType}>
          <option value="vtk">VTK</option>
          <option value="ply">PLY</option>
        </select>
        <input 
          type="file" 
          accept=".vtk,.ply"
          onChange={handleFileChange} 
        />
        <button onClick={handleLoadFile}>Load File</button>
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        <div>
          <label>Opacity: </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={opacity}
            onChange={handleOpacityChange}
            title="Adjust surface opacity"
          />
        </div>
        <div>
          <label>Edge Color: </label>
          <input
            type="color"
            onChange={handleEdgeColorChange}
            title="Select edge color"
          />
        </div>
      </div>
    </div>
  );
};

export default App;
