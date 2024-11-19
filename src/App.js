import React, { useEffect, useRef, useState } from 'react';
import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';
import vtkPLYReader from '@kitware/vtk.js/IO/Geometry/PLYReader';
import vtkCellPicker from '@kitware/vtk.js/Rendering/Core/CellPicker';

const App = () => {
  const vtkContainerRef = useRef(null);
  const context = useRef(null);
  const [fileType, setFileType] = useState('vtk');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [color, setColor] = useState('#000000');
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
        picker: vtkCellPicker.newInstance(), // Use vtkCellPicker for cell-based selection
        actors: [], // Track all actors
      };

      context.current.picker.setTolerance(0.005); // Adjust tolerance for selection sensitivity

      const handleRightButtonPress = (callData) => {
        const { renderer, renderWindow, actors } = context.current;
        if (renderer !== callData.pokedRenderer) return;
      
        const pos = callData.position;
        const point = [pos.x, pos.y, 0.0];
        context.current.picker.pick(point, renderer);
      
        // Deselect all actors before selecting the new one
        actors.forEach((actor) => {
          actor.getProperty().setColor(1.0, 1.0, 1.0); // Reset to white
          actor.getProperty().setOpacity(1.0); // Reset opacity
        });
      
        const pickedActor = context.current.picker.getActors().length > 0
          ? context.current.picker.getActors()[0]
          : null;
      
        if (pickedActor) {
          // Apply the currently selected color to the picked actor
          pickedActor.getProperty().setColor(...hexToRGB(color));
          pickedActor.getProperty().setOpacity(opacity);
          context.current.currentActor = pickedActor;
        } else {
          context.current.currentActor = null;
        }
      
        renderWindow.render();
      };
      
      
      renderWindow.getInteractor().onRightButtonPress(handleRightButtonPress);

      const handleKeyPress = (event) => {
        if (!context.current.currentActor) {
          console.log('No actor selected');
          return;
        }

        const actor = context.current.currentActor;
        const position = actor.getPosition();
        const stepSize = 0.1;

        if (event.key === 'ArrowLeft') {
          actor.setPosition(position[0] - stepSize, position[1], position[2]);
        } else if (event.key === 'ArrowRight') {
          actor.setPosition(position[0] + stepSize, position[1], position[2]);
        }
        context.current.renderWindow.render();
      };

      window.addEventListener('keydown', handleKeyPress);

      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [color, opacity]);

  const loadFile = (file, data) => {
    const { renderer, renderWindow } = context.current;
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    const reader = fileExtension === 'vtk' ? vtkPolyDataReader.newInstance() : vtkPLYReader.newInstance();
    reader.parseAsArrayBuffer(data);
  
    const polydata = reader.getOutputData(0);
    if (!polydata) {
      console.error("No output data from the reader.");
      return;
    }
  
    const mapper = vtkMapper.newInstance();
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    mapper.setInputData(polydata);
  
    actor.getProperty().setOpacity(opacity);
    actor.getProperty().setColor(...hexToRGB(color)); // Set initial color to the chosen color
    actor.setPosition(0, 0, 0);
  
    renderer.addActor(actor);
    context.current.actors.push(actor);
    renderer.resetCamera();
    renderWindow.render();
  
    context.current.picker.addPickList(actor);
  };
  

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setErrorMessage('');
  };

  const handleAddFiles = () => {
    if (selectedFiles.length === 0) return;

    selectedFiles.forEach((file) => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if ((fileType === 'vtk' && fileExtension !== 'vtk') || (fileType === 'ply' && fileExtension !== 'ply')) {
        setErrorMessage(`Unmatching file type: Expected a .${fileType} file`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        loadFile(file, data);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleOpacityChange = (e) => {
    setOpacity(parseFloat(e.target.value));
    context.current.actors.forEach((actor) => {
      actor.getProperty().setOpacity(parseFloat(e.target.value));
    });
    context.current.renderWindow.render();
  };

  const hexToRGB = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    return [r, g, b];
  };
  

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
  
    if (context.current.currentActor) {
      context.current.currentActor.getProperty().setColor(...hexToRGB(newColor));
    }
    context.current.renderWindow.render();
  };
  

  const clearAllActors = () => {
    const { renderer, actors, renderWindow } = context.current;
    actors.forEach((actor) => {
      renderer.removeActor(actor);
      actor.delete();
    });
    context.current.actors = [];
    context.current.currentActor = null;
    renderWindow.render();
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
          multiple
          onChange={handleFileChange} 
        />
        <button onClick={handleAddFiles}>Add Files</button>
        <button onClick={clearAllActors}>Clear All</button>
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
          <label>Color: </label>
          <input
            type="color"
            value={color}
            onChange={handleColorChange}
            title="Select color"
          />
        </div>
      </div>
    </div>
  );
};

export default App;




