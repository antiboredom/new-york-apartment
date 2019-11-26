import json
import bpy
import bmesh
from glob import glob

all_files = glob("/Users/sam/projects/new-york-apartment/floorplans/*.json")
wall_height = 4


def loadit(jpath):
    with open(jpath, "r") as infile:
        data = json.load(infile)
    return data


def delete_scene_objects(scene=None):
    """Delete a scene and all its objects."""
    for o in bpy.context.scene.objects:
        try:
            if o.type == "MESH":
                o.select_set(True)
            else:
                o.select_set(False)
        except Exception as e:
            print(e)
    try:
        bpy.ops.object.delete()
    except Exception as e:
        print(e)
    # bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
    # bpy.ops.wm.open_mainfile(filepath=bpy.data.filepath)


def create_mesh_object(context, vertlist, ratio):
    bm = bmesh.new()
    for faceverts in vertlist:
        bm_verts = []
        for vert in faceverts:
            bm_verts.append(bm.verts.new((vert[0]*ratio, vert[1]*ratio, 0)))
        bm.faces.new(bm_verts)

    me = bpy.data.meshes.new(name="MyMesh")
    ob = bpy.data.objects.new(name="Plan", object_data=me)
    bm.to_mesh(ob.data)
    context.scene.collection.objects.link(ob)

    obj = context.window.scene.objects["Plan"]
    bpy.context.view_layer.objects.active = obj  # 'obj' is the active object now

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_mode(type="FACE")
    bpy.ops.mesh.select_all(action="SELECT")

    bpy.ops.mesh.extrude_region_move(
        TRANSFORM_OT_translate={"value": (0, 0, wall_height)}
    )
    bpy.ops.object.mode_set(mode="OBJECT")


def create_mesh_floor(context, roomlist, ratio):
    bm = bmesh.new()
    for room in roomlist:
        bm_verts = []
        for vert in room["coords"]:
            bm_verts.append(bm.verts.new((vert[0]*ratio, vert[1]*ratio, 0)))
        bm.faces.new(bm_verts)

    me = bpy.data.meshes.new(name="MyMesh")
    ob = bpy.data.objects.new(name="Floor", object_data=me)
    bm.to_mesh(ob.data)
    context.scene.collection.objects.link(ob)

    obj = context.window.scene.objects["Floor"]
    bpy.context.view_layer.objects.active = obj  # 'obj' is the active object now

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_mode(type="FACE")
    bpy.ops.mesh.select_all(action="SELECT")

    bpy.ops.mesh.extrude_region_move(TRANSFORM_OT_translate={"value": (0, 0, 0.01)})
    # bpy.ops.mesh.flip_normals()
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    # obj = context.window.scene.objects["Floor"]
    # bpy.context.view_layer.objects.active = obj  # 'obj' is the active object now
    # obj.select_set(True)
    # bpy.ops.object.mode_set(mode="EDIT")
    # bpy.ops.mesh.select_all(action="SELECT")
    # bpy.ops.mesh.flip_normals()
    # bpy.ops.object.mode_set(mode="OBJECT")


def create_doors(context, doors, ratio):

    for i, faceverts in enumerate(doors):
        bm = bmesh.new()
        bm_verts = []
        bpy.context.scene.cursor.location = (faceverts[0][0]*ratio, faceverts[0][1]*ratio, 0.0)

        for vert in faceverts:
            bm_verts.append(bm.verts.new((vert[0]*ratio, vert[1]*ratio, 0)))
        bm.faces.new(bm_verts)

        me = bpy.data.meshes.new(name="DoorMesh_{}".format(i))
        ob = bpy.data.objects.new(name="Door_{}".format(i), object_data=me)
        bm.to_mesh(ob.data)
        context.scene.collection.objects.link(ob)

        obj = context.window.scene.objects["Door_{}".format(i)]
        bpy.context.view_layer.objects.active = obj  # 'obj' is the active object now

        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_mode(type="FACE")
        bpy.ops.mesh.select_all(action="SELECT")

        bpy.ops.mesh.extrude_region_move(
            TRANSFORM_OT_translate={"value": (0, 0, wall_height * 0.75)}
        )
        bpy.ops.object.mode_set(mode="OBJECT")

        obj.select_set(True)
        bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="MEDIAN")
        obj.select_set(False)
        # bpy.ops.mesh.select_all(action='DESELECT')
        # bpy.ops.mesh.select_all(action='SELECT')

        if obj.dimensions.x > obj.dimensions.y:
            bpy.context.object.delta_scale[1] = 3
        else:
            bpy.context.object.delta_scale[0] = 3
        bpy.context.object.delta_scale[2] = 1.1

        bpy.ops.object.select_all(action="DESELECT")

    plan = bpy.data.objects["Plan"]
    plan.select_set(True)
    bpy.context.view_layer.objects.active = plan

    for i in range(len(doors)):
        bpy.ops.object.modifier_add(type="BOOLEAN")
        bpy.context.object.modifiers["Boolean"].object = bpy.data.objects[
            "Door_{}".format(i)
        ]
        bpy.ops.object.modifier_apply(apply_as="DATA", modifier="Boolean")

    bpy.ops.object.select_all(action="DESELECT")
    for i in range(len(doors)):
        bpy.data.objects["Door_{}".format(i)].select_set(True)
    bpy.ops.object.delete()


def create_windows(context, windows, ratio):

    for i, faceverts in enumerate(windows):
        bm = bmesh.new()
        bm_verts = []
        # bpy.context.scene.cursor.location = (faceverts[0][0], faceverts[0][1], 10.0)

        for vert in faceverts:
            bm_verts.append(bm.verts.new((vert[0]*ratio, vert[1]*ratio, wall_height * 0.4)))
        bm.faces.new(bm_verts)

        me = bpy.data.meshes.new(name="WindowMesh_{}".format(i))
        ob = bpy.data.objects.new(name="Window_{}".format(i), object_data=me)
        bm.to_mesh(ob.data)
        context.scene.collection.objects.link(ob)

        obj = context.window.scene.objects["Window_{}".format(i)]
        bpy.context.view_layer.objects.active = obj  # 'obj' is the active object now

        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_mode(type="FACE")
        bpy.ops.mesh.select_all(action="SELECT")

        bpy.ops.mesh.extrude_region_move(
            TRANSFORM_OT_translate={"value": (0, 0, wall_height * 0.3)}
        )
        bpy.ops.object.mode_set(mode="OBJECT")

        obj.select_set(True)
        bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="MEDIAN")
        obj.select_set(False)

        if obj.dimensions.x > obj.dimensions.y:
            bpy.context.object.delta_scale[1] = 3
        else:
            bpy.context.object.delta_scale[0] = 3
        bpy.context.object.delta_scale[2] = 1.1

        bpy.ops.object.select_all(action="DESELECT")

    plan = bpy.data.objects["Plan"]
    plan.select_set(True)
    bpy.context.view_layer.objects.active = plan

    for i in range(len(windows)):
        bpy.ops.object.modifier_add(type="BOOLEAN")
        bpy.context.object.modifiers["Boolean"].object = bpy.data.objects[
            "Window_{}".format(i)
        ]
        bpy.ops.object.modifier_apply(apply_as="DATA", modifier="Boolean")

    bpy.ops.object.select_all(action="DESELECT")
    for i in range(len(windows)):
        bpy.data.objects["Window_{}".format(i)].select_set(True)
    bpy.ops.object.delete()


def seal_walls():
    bpy.ops.object.select_all(action="DESELECT")
    plan = bpy.data.objects["Plan"]
    plan.select_set(True)
    bpy.context.view_layer.objects.active = plan
    bpy.ops.mesh.convex_hull()


# def scale_apartment(context, doors):
#     # calculate average door width
#     # for i, faceverts in enumerate(doors):
#
#     bpy.ops.object.mode_set(mode="OBJECT")
#     obj.select_set(True)
#     bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="MEDIAN")
#     obj.select_set(False)


def scale_apartment(context, doors):
    if len(doors) == 0:
        return False

    total_length = 0
    total_width = 0
    smallest_length = 100
    smallest_width = 100
    # calculate average door width
    for i, door in enumerate(doors):
        length = abs(door[0][0] - door[1][0])
        width = abs(door[1][1] - door[2][1])
        total_length = total_length + length
        total_width = total_width + width
        average_length = total_length / (i + 1)
        average_width = total_width / (i + 1)
        if smallest_length > length:
            smallest_length = length
        if smallest_width > width:
            smallest_width = width

    print(doors)
    print("average length:")
    print(average_length)
    print("average width:")
    print(average_width)
    print("smallest length:")
    print(smallest_length)
    print("smallest width:")
    print(smallest_width)

    # move origin to edge of door
    # select the entire apartment
    plan = bpy.data.objects["Plan"]
    plan.select_set(True)
    bpy.context.view_layer.objects.active = plan

    # scale it 1/smallest_length
    bpy.context.object.delta_scale[0] = 0.84 / average_length
    bpy.context.object.delta_scale[1] = 0.84 / average_length

    # floor = bpy.data.objects["Floor"]
    # floor.select_set(True)
    # bpy.context.view_layer.objects.active = floor

    # scale it 1/smallest_length
    bpy.context.object.delta_scale[0] = 0.84 / average_length
    bpy.context.object.delta_scale[1] = 0.84 / average_length


def get_ratio(doors):
    if len(doors) == 0:
        return 1

    total_length = 0
    total_width = 0
    smallest_length = 100
    smallest_width = 100
    for i, door in enumerate(doors):
        length = abs(door[0][0] - door[1][0])
        width = abs(door[1][1] - door[2][1])
        total_length = total_length + length
        total_width = total_width + width
        average_length = total_length / (i + 1)
        average_width = total_width / (i + 1)
        if smallest_length > length:
            smallest_length = length
        if smallest_width > width:
            smallest_width = width

    ratio = 0.84 / average_length

    return ratio


def export_all():
    for filename in all_files[0:300]:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        # delete_scene_objects()
        data = loadit(filename)
        ratio = get_ratio(data["doors"])
        create_mesh_object(bpy.context, data["walls"], ratio)
        create_doors(bpy.context, data["doors"], ratio)
        create_windows(bpy.context, data["windows"], ratio)
        # create_mesh_floor(bpy.context, data["rooms"])
        # scale_apartment(bpy.context, data["doors"])

        try:
            # bpy.ops.export_scene.obj(filepath="test.obj")
            outname = filename.replace('floorplans', 'glbs') + ".glb"
            bpy.ops.export_scene.gltf(filepath=outname)
            # bpy.ops.export_scene.gltf(filepath="test.glb")
        except Exception as e:
            print(e)


if __name__ == "__main__":
    export_all()
