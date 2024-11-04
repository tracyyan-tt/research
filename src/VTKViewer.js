// VTKViewer.js
import React, { useEffect } from 'react';
import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPLYReader from '@kitware/vtk.js/IO/Geometry/PLYReader';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';

const VTKViewer = () => {
  useEffect(() => {
    let renderer = null;
    let renderWindow = null;
    let fullScreenRenderer = null; // Declare here for broader scope
    const reader = vtkPLYReader.newInstance();
    const mapper = vtkMapper.newInstance({ scalarVisibility: false });
    const actor = vtkActor.newInstance();

    actor.setMapper(mapper);
    mapper.setInputConnection(reader.getOutputPort());

    const refresh = () => {
      if (renderer && renderWindow) {
        const resetCamera = renderer.resetCamera;
        const render = renderWindow.render;
        resetCamera();
        render();
      }
    };

    const update = () => {
      fullScreenRenderer = vtkFullScreenRenderWindow.newInstance(); // Initialize here
      renderer = fullScreenRenderer.getRenderer();
      renderWindow = fullScreenRenderer.getRenderWindow();

      renderer.addActor(actor);

      actor.getMapper().setScalarVisibility(true);
      const clr = { r: 200 / 255.0, g: 200 / 255.0, b: 200 / 255.0 };
      actor.getProperty().setColor(clr.r, clr.g, clr.b);

      refresh();
    };

    // Use a file reader to load a local file
    const myContainer = document.querySelector('body');
    const fileContainer = document.createElement('div');
    fileContainer.innerHTML =
      '<div>Select a PLY file or a PLY file with its texture file.<br/><input type="file" class="file" multiple/></div>';
    myContainer.appendChild(fileContainer);

    const fileInput = fileContainer.querySelector('input');

    const handlePlyFile = (file) => {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        reader.parseAsArrayBuffer(fileReader.result);
        update();
      };
      fileReader.readAsArrayBuffer(file);
    };

    const handleImgFile = (file) => {
      const fileReader = new FileReader();

      fileReader.onload = () => {
        const image = new Image();
        image.src = fileReader.result;
        const texture = vtkTexture.newInstance();
        texture.setInterpolate(true);
        texture.setImage(image);
        actor.addTexture(texture);
        refresh();
      };
      fileReader.readAsDataURL(file);
    };

    const handleFile = (event) => {
      event.preventDefault();
      const dataTransfer = event.dataTransfer;
      const files = event.target.files || dataTransfer.files;
      if (files.length === 1) {
        myContainer.removeChild(fileContainer);
        handlePlyFile(files[0]);
      } else if (files.length > 1) {
        myContainer.removeChild(fileContainer);
        Array.from(files).forEach((file) => {
          const name = file.name.toLowerCase();
          if (name.endsWith('.ply')) {
            handlePlyFile(file);
          }
          if (
            name.endsWith('.png') ||
            name.endsWith('.jpg') ||
            name.endsWith('.jpeg')
          ) {
            handleImgFile(file);
          }
        });
      }
    };

    fileInput.addEventListener('change', handleFile);

    // Clean up on component unmount
    return () => {
      myContainer.removeChild(fileContainer);
      if (fullScreenRenderer) {
        fullScreenRenderer.delete(); // Use the initialized fullScreenRenderer
      }
    };
  }, []);

  return <div></div>; // This div can be styled if needed
};

export default VTKViewer;






























