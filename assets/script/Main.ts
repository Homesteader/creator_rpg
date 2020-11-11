// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

import SceneMap from "./SceneMap";
import MapData from "./map/base/MapData";
import { MapLoadModel } from "./map/base/MapLoadModel";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Main extends cc.Component {

    @property(SceneMap)
    sceneMap: SceneMap = null;

    @property(cc.Button)
    jumpBtn : cc.Button = null;

    private mapName:string = "";
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

        cc.debug.setDisplayStats(false);

        this.sceneMap.node.active = false;

        this.loadSlicesMap();
        
        this.jumpBtn.node.on(cc.Node.EventType.TOUCH_END,this.jumpMap,this)
    }

    /**
     * 加载单张地图
     */
    protected loadSingleMap()
    {

        var mapName:string = "mapData";

        cc.loader.loadRes("map/data/" + mapName,cc.JsonAsset,(error:Error,res:cc.JsonAsset)=>
        {
            var mapData:MapData = res.json;

            cc.loader.loadRes("map/bg/" + mapData.bgName,cc.Texture2D,(error:Error,tex:cc.Texture2D)=>
            {
                this.sceneMap.node.active = true;
                this.sceneMap.init(mapData,tex,MapLoadModel.single)
            });

        });
    }


    /**
     * 加载分切片地图
     */
    protected loadSlicesMap()
    {   
        
        var mapName:string =  this.mapName == "map1" ? "map2":"map1";
        console.log("this.map name: " + this.mapName + ",mapName:" + mapName);
        var pos = mapName == "map1" ? cc.v2(50,138):cc.v2(920,190)
        cc.loader.loadRes("map/data/" + mapName,cc.JsonAsset,(error:Error,res:cc.JsonAsset)=>
        {
            var mapData:MapData = res.json;

            cc.loader.loadRes("map/bg/" + mapData.bgName + "/miniMap",cc.Texture2D,(error:Error,tex:cc.Texture2D)=>
            {
                this.mapName = mapName;
                this.sceneMap.node.active = true;
                this.sceneMap.init(mapData,tex,MapLoadModel.slices)
                this.sceneMap.initPlayerPos(pos.x,pos.y);
            });

        });
    }

    jumpMap(){
        this.loadSlicesMap();
    }
    // update (dt) {}
}
