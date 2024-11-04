import vtk

# File path for your VTK file
file_path = "public/data/ply/vortex.vtk"

# Create a reader for unstructured grid data
reader = vtk.vtkUnstructuredGridReader()
reader.SetFileName(file_path)

# Attempt to read the file
try:
    reader.Update()
    print(f"Successfully loaded the file at {file_path}")

    # Create a mapper and actor for rendering
    mapper = vtk.vtkDataSetMapper()
    mapper.SetInputConnection(reader.GetOutputPort())

    actor = vtk.vtkActor()
    actor.SetMapper(mapper)

    # Setup rendering window, renderer, and interactor
    renderer = vtk.vtkRenderer()
    render_window = vtk.vtkRenderWindow()
    render_window.AddRenderer(renderer)
    render_interactor = vtk.vtkRenderWindowInteractor()
    render_interactor.SetRenderWindow(render_window)

    # Add actor to renderer and set background color
    renderer.AddActor(actor)
    renderer.SetBackground(0.1, 0.2, 0.4)  # Background color: dark blue

    # Render and start interaction
    render_window.Render()
    render_interactor.Start()

except Exception as e:
    print(f"Error while loading the file: {e}")



