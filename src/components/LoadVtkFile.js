// src/components/LoadVtkFile.js
import React, { useEffect } from 'react';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

const LoadVtkFile = () => {
  useEffect(() => {
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();

    const reader = vtkPolyDataReader.newInstance();
    reader.setUrl('/data/legacy/vortex.vtk').then(() => {
      const polydata = reader.getOutputData(0);
      const mapper = vtkMapper.newInstance();
      const actor = vtkActor.newInstance();

      actor.setMapper(mapper);
      mapper.setInputData(polydata);
      renderer.addActor(actor);

      renderer.resetCamera();
      renderWindow.render();
    });
  }, []);

  return null; // You can also return a loading message if you want
};

export default LoadVtkFile;

