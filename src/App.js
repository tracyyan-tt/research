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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [edgeColor, setEdgeColor] = useState('#000000');
  const [opacity, setOpacity] = useState(0.5);
  const [colorChanged, setColorChanged] = useState(false);

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
        picker: vtkPointPicker.newInstance(),
        actors: [], // Track all actors
      };

      const handleRightButtonPress = (callData) => {
        const { renderer, renderWindow } = context.current;
        if (renderer !== callData.pokedRenderer) return;

        const pos = callData.position;
        const point = [pos.x, pos.y, 0.0];
        context.current.picker.pick(point, renderer);

        // Deselect all actors' edges before selecting the new one
        context.current.actors.forEach((actor) => {
          actor.getProperty().setEdgeVisibility(false);
        });

        const pickedActor = context.current.picker.getActors().length > 0
          ? context.current.picker.getActors()[0]
          : null;

        if (pickedActor) {
          pickedActor.getProperty().setEdgeVisibility(true);

          if (colorChanged) {
            pickedActor.getProperty().setEdgeColor(...hexToRGB(edgeColor));
          }

          pickedActor.getProperty().setOpacity(opacity);
          context.current.currentActor = pickedActor;
          console.log('Selected actor:', pickedActor); // Confirm actor selection
        } else {
          context.current.currentActor = null;
        }

        renderWindow.render();
      };

      renderWindow.getInteractor().onRightButtonPress(handleRightButtonPress);

      // Set up event listener for keyboard controls
      const handleKeyPress = (event) => {
        if (!context.current.currentActor) {
          console.log('No actor selected'); // Debugging statement
          return;
        }

        const actor = context.current.currentActor;
        const position = actor.getPosition();
        const stepSize = 0.1; // Define how much the object moves with each key press

        if (event.key === 'ArrowLeft') {
          console.log('Moving left from position:', position);
          actor.setPosition(position[0] - stepSize, position[1], position[2]);
          console.log('New position:', actor.getPosition());
        } else if (event.key === 'ArrowRight') {
          console.log('Moving right from position:', position);
          actor.setPosition(position[0] + stepSize, position[1], position[2]);
          console.log('New position:', actor.getPosition());
        }
        context.current.renderWindow.render();
      };

      window.addEventListener('keydown', handleKeyPress);

      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [edgeColor, opacity, colorChanged, vtkContainerRef]);

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
    
    // Ensure the actor starts at a position so it can be moved later
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
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r / 255, g / 255, b / 255];
  };

  const handleEdgeColorChange = (e) => {
    const newColor = e.target.value;
    setEdgeColor(newColor);
    setColorChanged(true);

    context.current.actors.forEach((actor) => {
      actor.getProperty().setEdgeColor(...hexToRGB(newColor));
    });
    context.current.renderWindow.render();
  };

  const clearAllActors = () => {
    const { renderer, actors, renderWindow } = context.current;
    actors.forEach((actor) => {
      renderer.removeActor(actor); // Remove actor from renderer
      actor.delete(); // Clean up the actor resources
    });
    context.current.actors = []; // Clear the actors list
    context.current.currentActor = null; // Clear any selected actor
    renderWindow.render(); // Refresh the render window
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
        <button onClick={clearAllActors}>Clear All</button> {/* Clear All button */}
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
            value={edgeColor}
            onChange={handleEdgeColorChange}
            title="Select edge color"
          />
        </div>
      </div>
    </div>
  );
};

export default App;
