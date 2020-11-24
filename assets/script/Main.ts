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

    private curMapData:MapData = null
    // LIFE-CYCLE CALLBACKS:

    //  onLoad () {
        
    //  }

    start () {

        cc.debug.setDisplayStats(false);

        this.sceneMap.node.active = false;

        this.loadBundle();
    
    }

    /**
     * 加载资源
     */
    protected loadBundle()
    {
        cc.assetManager.loadBundle('player',(error:Error,buddle)=>{
            if(error)
            {
               return console.error(error);
            }
        })

        cc.assetManager.loadBundle('room_1_1',(error,buddle)=>{
            if(error)
            {
                return console.error(error)
            }
        })

        cc.assetManager.loadBundle('map2',(error:Error,buddle)=>{
            if(error)
            {
               return console.error(error);
            }
        })

        cc.assetManager.loadBundle('map1',(error:Error,buddle)=>{
            if(error)
            {
                console.log(error.message)
               return console.error(error);
            }

            this.loadSlicesMap("map1",null);
        })

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
    protected loadSlicesMap(mapName,targetPos)
    {   
     
        let bundle = cc.assetManager.getBundle(mapName);
        if(bundle == null)
        {
            cc.assetManager.loadBundle(mapName,(error:Error,buddle)=>{
                if(error)
                {
                   return console.error(error);
                }
                this.loadMapRes(mapName,buddle,targetPos);
            })
        }
        else
        {
            this.loadMapRes(mapName,bundle,targetPos);
        }
    }

    protected loadMapRes(mapName:string,bundle:cc.AssetManager.Bundle,targetPos:number[])
    {
        console.log("loadMapRes:",mapName)
        if(bundle == null)
            return;
     
        cc.loader.loadRes("map/data/" + mapName,cc.JsonAsset,(error:Error,res:cc.JsonAsset)=>
        {
            var mapData:MapData = res.json;
            console.log("transportData: ",mapData.transportData[0].scale)
            bundle.load("miniMap",cc.Texture2D,(error:Error,tex:cc.Texture2D)=>
            {
                if(error)
                    return console.error(error);
                console.log("load map success:",mapName,mapData.name);
                this.sceneMap.node.active = true;
                this.sceneMap.init(mapData,tex,targetPos,(targetMapName,targetPos)=>{
                    this.jumpMap(targetMapName,targetPos);
                },MapLoadModel.slices)                
            });

        });

       
    }

    jumpMap(mapName:string,targetPos){
        this.loadSlicesMap(mapName,targetPos);
    }

    // update (dt) {}
}
