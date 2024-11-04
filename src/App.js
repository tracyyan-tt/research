import React, { useEffect, useRef, useState } from 'react';
import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';
import vtkPLYReader from '@kitware/vtk.js/IO/Geometry/PLYReader';

const App = () => {
  const vtkContainerRef = useRef(null);
  const context = useRef(null);
  const [fileType, setFileType] = useState('vtk'); // Default file type
  const [fileName, setFileName] = useState('newvortex.vtk'); // Default file name

  // Initialize the VTK rendering context
  useEffect(() => {
    if (!context.current) {
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        rootContainer: vtkContainerRef.current,
      });
      context.current = {
        fullScreenRenderer,
        renderer: fullScreenRenderer.getRenderer(),
        renderWindow: fullScreenRenderer.getRenderWindow(),
        currentActor: null, // To keep track of the current actor
      };
    }
  }, [vtkContainerRef]);

  // Clear the current actor
  const clearCurrentActor = () => {
    const { currentActor, renderer, renderWindow } = context.current;
    if (currentActor) {
      renderer.removeActor(currentActor);
      currentActor.delete(); // Clean up the actor
      context.current.currentActor = null; // Clear the current actor reference
      renderWindow.render(); // Render the updated scene
    }
  };

  // Load VTK file
  const loadVTKFile = (file) => {
    const { renderer, renderWindow } = context.current;
    clearCurrentActor(); // Clear any existing actor before loading a new one
    const reader = vtkPolyDataReader.newInstance();
    
    reader.setUrl(`${process.env.PUBLIC_URL}/data/legacy/${file}`).then(() => {
      const polydata = reader.getOutputData(0);
      
      if (!polydata) {
        console.error("No output data from the VTK reader.");
        return;
      }

      const mapper = vtkMapper.newInstance();
      const actor = vtkActor.newInstance();
      
      actor.setMapper(mapper);
      mapper.setInputData(polydata); // Set input data as polydata

      renderer.addActor(actor);
      context.current.currentActor = actor; // Update the current actor reference
      renderer.resetCamera();
      renderWindow.render();
    }).catch(err => {
      console.error("Error loading VTK file:", err);
    });
  };

  // Load PLY file
  const loadPLYFile = (file) => {
    const { renderer, renderWindow } = context.current;
    clearCurrentActor(); // Clear any existing actor before loading a new one
    const reader = vtkPLYReader.newInstance();
    
    reader.setUrl(`${process.env.PUBLIC_URL}/data/legacy/${file}`).then(() => {
      const polydata = reader.getOutputData(0);
      
      if (!polydata) {
        console.error("No output data from the PLY reader.");
        return;
      }

      const mapper = vtkMapper.newInstance();
      const actor = vtkActor.newInstance();
      
      actor.setMapper(mapper);
      mapper.setInputData(polydata);

      renderer.addActor(actor);
      context.current.currentActor = actor; // Update the current actor reference
      renderer.resetCamera();
      renderWindow.render();
    }).catch(err => {
      console.error("Error loading PLY file:", err);
    });
  };

  // Load the selected file based on type
  const loadFile = () => {
    if (fileType === 'vtk') {
      loadVTKFile(fileName);
    } else if (fileType === 'ply') {
      loadPLYFile(fileName);
    }
  };

  return (
    <div>
      <div ref={vtkContainerRef} style={{ height: '100vh' }} />
      <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'white', padding: '10px' }}>
        <select onChange={(e) => setFileType(e.target.value)}>
          <option value="vtk">VTK</option>
          <option value="ply">PLY</option>
        </select>
        <input 
          type="text" 
          value={fileName} 
          onChange={(e) => setFileName(e.target.value)} 
          placeholder="Enter file name"
        />
        <button onClick={loadFile}>Load File</button>
      </div>
    </div>
  );
};

export default App;





























