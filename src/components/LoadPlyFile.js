// src/components/LoadPlyFile.js
import React, { useEffect } from 'react';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkPLYReader from '@kitware/vtk.js/IO/Geometry/PLYReader';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

const LoadPlyFile = () => {
  useEffect(() => {
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();

    const reader = vtkPLYReader.newInstance();
    reader.setUrl('/data/ply/mesh.ply').then(() => {
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

export default LoadPlyFile;



