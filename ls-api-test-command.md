# 灯控制测试
| Field      | Value                            |
| :--------- | :------------------------------- |
| 测试场地ID | 86592b25f0-192255                |
| MeshID     | 00000000000000000000000000000000 |
| DeviceID   | 37 ～ 42均可以测试               |

本服务已部署到云端，可以在任何有网络的地方进行测试

## 开灯

```
curl -X POST https://www.lengshuotech.com:3002/api/v1/scenes/86592b25f0-192255/meshes/00000000000000000000000000000000/devices/37 -H 'Content-Type: application/json' -d '{"cmd": "on"}'
```


## 关灯
```
curl -X POST https://www.lengshuotech.com:3002/api/v1/scenes/86592b25f0-192255/meshes/00000000000000000000000000000000/devices/37 -H 'Content-Type: application/json' -d '{"cmd": "off"}'
```

## 调节亮度 (暂不可测)
```
curl -X POST https://www.lengshuotech.com:3002/api/v1/scenes/86592b25f0-192255/meshes/00000000000000000000000000000000/devices/37 -H 'Content-Type: application/json' -d '{"cmd": "dim","param":20}'
```

