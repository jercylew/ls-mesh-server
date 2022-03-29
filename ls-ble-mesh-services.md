# Lengshuo Ble Mesh Service Api (Version 1.0.0)

##### Copyright (2021) Shenzhen Lengshuo Technology Co., Ltd

------------------------------------------

## Introduction
This api is for lengshuo ble devices, the customers currently may get status of devices and other host info with this api. Modification (i.e, PUT/DELETE and POST except login and commands) services are disabled.

Current supported services can be classified as following categories:

- **Device status**

Info about the gateway, host, all sensors and executers 

- **Scene info**

Some scene infos like scene id, scene name, location (GPS coordinate), address, contact number

- **Video info**
  
In some scenes, there may be camera devices installed, then the video info can also be obtained with this api, eg., video camera vendor, channels, encode version

- **Commands**

For this service, the client may send commands to a single device or a group devices, eg., turn on a light, switch off all relays in a specified area with a group of relay IDs, the following are possible scenarioes
1. CMD   ------>    sceneA.device0
2. [CMD0, CMD1, CMD2, ...]   ------->    sceneA.device0
3. CMD   ------>    [sceneA.device0, sceneA.device1, sceneA.device2, ..., sceneB.device0, sceneB.device1, sceneB.device2, ...]
4. [CMD0, CMD1, CMD2, ...] ------->    [sceneA.device0, sceneA.device1, sceneA.device2, ..., sceneB.device0, sceneB.device1, sceneB.device2, ...]

- **Production**
  
  For internal use only, which will not be exposed to clients, eg, software/firmware upgrade, device status, heartbeat report, 


## API
### **1. List scenes**
#### Overview

> Get a list of all scenes, each item is a short brief for a particular scene.
> 
> For super root user, this service will return all installed scenes, for normal user, it only returns the list of scens of its own, scenes of other clients will not be returned 

#### Endpoint

> [https://api.lengshuo.com/v1/scenes](https://api.lengshuo.com/v1/scenes)

#### Response format

> JSON

#### Method

> GET

#### Parameters

|Field|required|type|In|Description|
|:----- |:-------|:-----|:----- |:----- |
|ls-token |ture |string|header|The token for the user to access this service |
|Accept |false |string |header|The expected response format|

#### Response

|Field|type|Description |
|:----- |:------|:----------------------------- |
|status | int |Status of the operating, 0: succeed, Non-0: Failed  |
|message | string | The text message for the operating |
|data | array |The list of returned scenes |

##### Scene overview
This is for a item in the `data` filed of above response
|Field|type|Description |
|:----- |:------|:----------------------------- |
|scene_id | string | A unique id for the scene (usually same as gateway id)  |
|scene_name | string | The name of the scene |
|loc | string |The gps coordinate of the scene |
|tel_no | string |The telephone number for contact |
|frp_port | int |The oPort number used for remote access |
|frp_server | string |The ip of the frp server |
|host_id | string |For TKTConfigHelper only |

#### Example

- ##### Shell
```
    curl \
        -H "ls-token: 12345678901a2b3c4d5e6f" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        https://www.lengshuo.com/api/v1.1.0/scenes
```
- ##### Node
- ##### Python
- ##### Java
- ##### Go
- ##### C++
- ##### C#
- ##### PHP

> Sample Response

> >On success
```
{
  state: 0,
  message: 'Succeed in retriving scenes',
  data: [
    {
      scene_id: '1a2s3d4f257-7a8e4c6d',
      scene_name: 'XXXX Tech Pte Ltd',
      loc: '30.7766895,104.0007492',
      tel_no: '+61-423780700',
      frp_port: 50001,
      frp_server: 'www.lengshuo.com',
      host_id: '1a2s3d4f257'
    },
    {
      scene_id: '143235f257-7a8ee45fde', 
      scene_name: 'XXXX Tech Pte Ltd',
      loc: '50.7766895,102.0007492',
      tel_no: '+61-423780704',
      frp_port: 50002,
      frp_server: 'www.lengshuo.com',
      host_id: '1a2s3d4f257'
    }
  ]
}
```
>> On Failure
```
{
  state: 1,
  message: 'Failed to get scenes: Token validation error',
  data: []
}
```
```
{
  state: 2,
  message: 'Failed to get scenes: Internal error',
  data: []
}
```

### **2. Get a scene**
#### Overview

> Get a scene with specified ID
> 

#### Endpoint

> [https://api.lengshuo.com/v1/scenes/:scene_id](https://api.lengshuo.com/v1/scenes/:scene_id)

#### Response format

> JSON

#### Method

> GET

#### Parameters

|Field|required|type|In|Description|
|:----- |:-------|:-----|:----- |:----- |
|ls-token |ture |string|header|The token for the user to access this service |
|Accept |false |string |header|The expected response format|

#### Response

|Field|type|Description |
|:----- |:------|:----------------------------- |
|status | int |Status of the operating, 0: succeed, Non-0: Failed  |
|message | string | The text message for the operating |
|data | json object |The list of returned scenes |

##### Scene overview
This is for a item in the `data` filed of above response
|Field|type|Description |
|:----- |:------|:----------------------------- |
|scene_id | string | A unique id for the scene (usually same as gateway id)  |
|scene_name | string | The name of the scene |
|loc | string |The gps coordinate of the scene |
|tel_no | string |The telephone number for contact |
|frp_port | int |The oPort number used for remote access |
|frp_server | string |The ip of the frp server |
|host_id | string |For TKTConfigHelper only |

#### Example

- ##### Shell
```
    curl \
        -H "ls-token: 12345678901a2b3c4d5e6f" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        https://www.lengshuo.com/api/v1.1.0/scenes/123456abcde-1e2f3a4d
```
- ##### Node
- ##### Python
- ##### Java
- ##### Go
- ##### C++
- ##### C#
- ##### PHP

> Sample Response

> >On success
```
{
state: 0,
message: 'Succeed in retriving scene',
data: 
  {
    scene-id: '1a2s3d4f257-7a8e4c6d',
    scene-name: 'XXXX Tech Pte Ltd',
    loc: '30.7766895,104.0007492',
    tel-no: '+61-423780700',
    frp-port: 50001,
    frp-server: 'www.lengshuo.com',
    host-id: '1a2s3d4f257'
  }
}
```
>> On Failure
```
{
  state: 1,
  message: 'Failed to get scene: Token validation error',
  data: {}
}

```
```
{
  state: 2,
  message: 'Failed to get scene: Internal error',
  data: {}
}
```

### **3. List meshs**
#### Overview

> Get a list of meshs in a scene with specified ID
>

#### Endpoint

> [https://api.lengshuo.com/v1/scenes/:scene_id/meshs](https://api.lengshuo.com/v1/scenes/:scene_id/meshs)

#### Response format

> JSON

#### Method

> GET

#### Parameters

|Field|required|type|In|Description|
|:----- |:-------|:-----|:----- |:----- |
|ls-token |ture |string|header|The token for the user to access this service |
|Accept |false |string |header|The expected response format|

#### Response

|Field|type|Description |
|:----- |:------|:----------------------------- |
|status | int |Status of the operating, 0: succeed, Non-0: Failed  |
|message | string | The text message for the operating |
|data | array |The list of returned meshs |

##### Mesh overview
This is for a item in the `data` filed of above response
|Field|type|Description |
|:----- |:------|:----------------------------- |
|mesh_uuid | string | A unique id for the mesh |
|mesh_name | string | The name of the mesh |
|mesh_password | string |The name of the mesh |
|auto_schedule_is_on | boolean |State if the auto schedule turned on |
|bind_com_name_to_mesh_name | boolean |State if the comport bound to mesh name |
|com_is_enabled | boolean |State if comport is enabled |
|com_is_opened | boolean |State if the comport opened |
|com_name | string |The comport name |
|mesh_address | string |The bluetooth address for the mesh |
|mesh_ltk | string |The mesh ltk |
|read_frames | int |The number of bytes read from the comports |

#### Example

- ##### Shell
```
    curl \
        -H "ls-token: 12345678901a2b3c4d5e6f" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        https://api.lengshuo.com/v1/scenes/123456ade-0a8b3cf/meshs
```
- ##### Node
- ##### Python
- ##### Java
- ##### Go
- ##### C++
- ##### C#
- ##### PHP

> Sample Response

> >On success
```
{
state: 0,
message: 'Succeed in retriving meshs',
data: [
  {
    mesh_name:"TKT_MESH1",
    mesh_password:"0000",
    mesh_uuid:"00000000000000000000000000000000",
    auto_schedule_is_on:false,
    bind_com_name_to_mesh_name:false,
    com_is_enabled:true,
    com_is_opened:true,
    com_name:"/dev/ttyUSB0",
    mesh_address:200,
    mesh_ltk:"C0 C1 C2 C3 C4 C5 C6 C7 D8 D9 DA DB DC DD DE DF",
    read_frames:88854
  },
  {
    mesh_name:"TKT_MESH2",
    mesh_password:"0000",
    mesh_uuid:"a012000000ae00000000bf0003d007f0",
    auto_schedule_is_on:false,
    bind_com_name_to_mesh_name:false,
    com_is_enabled:true,
    com_is_opened:true,
    com_name:"/dev/ttyUSB1",
    mesh_address:200,
    mesh_ltk:"C0 C1 C2 C3 C4 C5 C6 C7 D8 D9 DA DB DC DD DE DF",
    read_frames:854
  },
]
}
```
>> On Failure
```
{
state: 1,
message: 'Failed to get meshs: Token validation error',
data: []
}

{
state: 2,
message: 'Failed to get meshs: Internal error',
data: []
}
```

### **4. Get a mesh**
#### Overview

> Get a mesh with specified ID
>

#### Endpoint

> [https://api.lengshuo.com/v1/scenes/:scene_id/meshs/:mesh_id](https://api.lengshuo.com/v1/scenes/:scene_id/meshs/:mesh_id)

#### Response format

> JSON

#### Method

> GET

#### Parameters

|Field|required|type|In|Description|
|:----- |:-------|:-----|:----- |:----- |
|ls-token |ture |string|header|The token for the user to access this service |
|Accept |false |string |header|The expected response format|

#### Response

|Field|type|Description |
|:----- |:------|:----------------------------- |
|status | int |Status of the operating, 0: succeed, Non-0: Failed  |
|message | string | The text message for the operating |
|data | json object |The list of returned meshs |

##### Mesh overview
This is for a item in the `data` filed of above response
|Field|type|Description |
|:----- |:------|:----------------------------- |
|mesh_uuid | string | A unique id for the mesh |
|mesh_name | string | The name of the mesh |
|mesh_password | string |The name of the mesh |
|auto_schedule_is_on | boolean |State if the auto schedule turned on |
|bind_com_name_to_mesh_name | boolean |State if the comport bound to mesh name |
|com_is_enabled | boolean |State if comport is enabled |
|com_is_opened | boolean |State if the comport opened |
|com_name | string |The comport name |
|mesh_address | string |The bluetooth address for the mesh |
|mesh_ltk | string |The mesh ltk |
|read_frames | int |The number of bytes read from the comports |

#### Example

- ##### Shell
```
    curl \
        -H "ls-token: 12345678901a2b3c4d5e6f" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        https://api.lengshuo.com/v1/scenes/123456ade-0a8b3cf/meshs/a012000000ae00000000bf0003d007f0
```
- ##### Node
- ##### Python
- ##### Java
- ##### Go
- ##### C++
- ##### C#
- ##### PHP

> Sample Response

> >On success
```
{
  state: 0,
  message: 'Succeed in retriving mesh',
  data:
    {
      mesh_name:"TKT_MESH1",
      mesh_password:"0000",
      mesh_uuid:"a012000000ae00000000bf0003d007f0",
      auto_schedule_is_on:false,
      bind_com_name_to_mesh_name:false,
      com_is_enabled:true,
      com_is_opened:true,
      com_name:"/dev/ttyUSB0",
      mesh_address:200,
      mesh_ltk:"C0 C1 C2 C3 C4 C5 C6 C7 D8 D9 DA DB DC DD DE DF",
      read_frames:88854
    }
}
```
>> On Failure
```
{
  state: 1,
  message: 'Failed to get meshs: Token validation error',
  data: {}
}
```
```
{
  state: 2,
  message: 'Failed to get meshs: Internal error',
  data: {}
}
```

### **5. List devices**
#### Overview

> Get a list of all devices in a mesh
>

#### Endpoint

> [https://api.lengshuo.com/v1/scenes/:scene_id/meshs/:mesh_id/devices](https://api.lengshuo.com/v1/scenes/:scene_id/meshs/:mesh_id/devices)

#### Response format

> JSON

#### Method

> GET

#### Parameters

|Field|required|type|In|Description|
|:----- |:-------|:-----|:----- |:----- |
|ls-token |ture |string|header|The token for the user to access this service |
|Accept |false |string |header|The expected response format|
|list-id-only |false |boolean |header|Indicates return a list of IDs or details about device, true by default |

#### Response

|Field|type|Description |
|:----- |:------|:----------------------------- |
|status | int |Status of the operating, 0: succeed, Non-0: Failed  |
|message | string | The text message for the operating |
|data | array |The list of returned devices |

##### Device Data
This is for a item in the `data` filed of above response, the status data for a device varies depending on its type.

###### **_Common Fields_**
All devices share the following fields
|Field|type|Description |
|:----- |:------|:----------------------------- |
|dev_id | string | A unique id for the device |
|dev_name | string | The name of the device |
|dev_address | int | The bluetooth address of the device |
|online | boolean | State if the device is online or offline |
|type | string | The type of the device |
|kind | string | Sensor or Executer  |
|groups | array | The groups to which the device is allocated  |

###### **_Status Data Fields_**
These fields are device specific, thus should be handled in accordance with the device type.
> - The devices can be classified into **Executers** and **Sensors**.
> - The executer, as its name indicates, is responsible for performing some actions such as turnning on or off lights
> - The sensor is responsible to collect specific data in a scene like temperature, humidity, CO, CO2, PM2.5, etc.,

> **The following devices are supported**
1. **Executers**
- _One-chanel Relay_

|Field|type|Description |
|:----- |:------|:----------------------------- |
|on | boolean | The switch state |

- _One-chanel Luminaire_

|Field|type|Description |
|:----- |:------|:----------------------------- |
|brightness | int |The brightness the device |
|voltage | double | The votage of the device |
|power | double | The power of the device |
|energy | double | The energy of the device |

2. **Sensors**
- _Real Motion Sensor_

|Field|type|Description |
|:----- |:------|:----------------------------- |
|triggered | boolean | State if triggerred |

- _Temperature Humidity Sensor_

|Field|type|Description |
|:----- |:------|:----------------------------- |
|temp | double | Temperature |
|hum | double | Humidity |

- _Lux Sensor_

|Field|type|Description |
|:----- |:------|:----------------------------- |
|lux | double | The lux for the lux sensor |

#### Example

- ##### Shell
```
    curl \
        -H "ls-token: 12345678901a2b3c4d5e6f" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -H "list-id-only: false" \
        https://api.lengshuo.com/v1/scenes/123456ade-0a8b3cf/meshs/a012000000ae00000000bf0003d007f0/devices
```
- ##### Node
- ##### Python
- ##### Java
- ##### Go
- ##### C++
- ##### C#
- ##### PHP

> Sample Response

> >On success
```
{
state: 0,
message: 'Succeed in retriving devices',
data: [
  {
    dev_id: "TH.131",
    dev_name: "Kichen Area TEMP Sensor",
    dev_address: 131,
    online: true,
    type: "temp_hum_sensor",
    kind: "Sensor",
    groups: [1, 5, 10],
    temp: 25.60,
    hum: 72.55
  },
  {
    dev_id: "RM.132",
    dev_name: "Frontdoor Real Motion  Sensor",
    dev_address: 132,
    online: true,
    type: "real_motion_sensor",
    kind: "Sensor",
    groups: [1, 5, 10],
    triggered: false
  },
]
}
```
>> On Failure
```
{
state: 1,
message: 'Failed to get devices: Token validation error',
data: []
}

{
state: 2,
message: 'Failed to get devices: Internal error',
data: []
}
```

### **6. Get a device**
#### Overview

> Get a device with specified ID
>

#### Endpoint

> [https://api.lengshuo.com/v1/scenes/:scene_id/meshs/:mesh_id/devices/:dev_id](https://api.lengshuo.com/v1/scenes/:scene_id/meshs/:mesh_id/devices/:dev_id)

#### Response format

> JSON

#### Method

> GET

#### Parameters

|Field|required|type|In|Description|
|:----- |:-------|:-----|:----- |:----- |
|ls-token |ture |string|header|The token for the user to access this service |
|Accept |false |string |header|The expected response format|

#### Response

|Field|type|Description |
|:----- |:------|:----------------------------- |
|status | int |Status of the operating, 0: succeed, Non-0: Failed  |
|message | string | The text message for the operating |
|data | array |The list of returned meshs |

##### Device Data 
This is for a item in the `data` filed of above response. For its fields info, refer to the same section in [ 5. List Devices ](), the fields info in the `data` are almost same except it only contains a single item


#### Example

- ##### Shell
```
    curl \
        -H "ls-token: 12345678901a2b3c4d5e6f" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        https://api.lengshuo.com/v1/scenes/123456ade-0a8b3cf/meshs/a012000000ae00000000bf0003d007f0/devices/TH.131
```
- ##### Node
- ##### Python
- ##### Java
- ##### Go
- ##### C++
- ##### C#
- ##### PHP

> Sample Response

> >On success
```
{
state: 0,
message: 'Succeed in retriving device',
data:
  {
    dev_id: "TH.131",
    dev_name: "Kichen Area TEMP Sensor",
    dev_address: 131,
    online: true,
    type: "temp_hum_sensor",
    kind: "Sensor",
    groups: [1, 5, 10],
    temp: 25.60,
    hum: 72.55
  }
}
```
>> On Failure
```
{
state: 1,
message: 'Failed to get meshs: Token validation error',
data: []
}

{
state: 2,
message: 'Failed to get meshs: Internal error',
data: []
}
```
