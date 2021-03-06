
import { MapType } from "./map/base/MapType";
import MapLayer from "./map/layer/MapLayer";
import EntityLayer from "./map/layer/EntityLayer";
import Charactor from "./map/charactor/Charactor";
import RoadNode from "./map/road/RoadNode";
import IRoadSeeker from "./map/road/IRoadSeeker";
import MapData from "./map/base/MapData";
import MapRoadUtils from "./map/road/MapRoadUtils";
import AstarHoneycombRoadSeeker from "./map/road/AstarHoneycombRoadSeeker";
import AStarRoadSeeker from "./map/road/AStarRoadSeeker";
import Point from "./map/road/Point";
import { MapLoadModel } from "./map/base/MapLoadModel";
import MapParams from "./map/base/MapParams";
import TransportData from "./map/base/TransportData";
// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

/**
 * 地图场景逻辑
 * @author 落日故人 QQ 583051842
 * 
 */
@ccclass
export default class SceneMap extends cc.Component {

    @property(cc.Node)
    public layer: cc.Node = null;

    @property(cc.Node)
    public transportNode:cc.Node = null;

    @property(MapLayer)
    public mapLayer: MapLayer = null;

    @property(EntityLayer)
    public entityLayer: EntityLayer = null;

    @property(Charactor)
    private player:Charactor = null;

    @property(cc.Camera)
    private camera:cc.Camera = null;

    @property()
    public isFollowPlayer:boolean = true;

    @property(cc.VideoPlayer)
    videoplayerMp4: cc.VideoPlayer = null
    
    @property(cc.Sprite)
    videoBg : cc.Sprite = null

    @property(cc.Button)
    videoPlayBtn : cc.Button = null

    @property(cc.Label)
    videoBtnTx : cc.Label = null

    private _roadDic:{[key:string]:RoadNode} = {};

    private _roadSeeker:IRoadSeeker;

    private targetPos:cc.Vec2 = cc.Vec2.ZERO;

    //private _mapData:MapData = null;

    private _mapParams:MapParams = null;

    private arriveCallBack = null;

    private transportNodes:cc.Node[] = []

    // LIFE-CYCLE CALLBACKS:

     onLoad () {
        this.videoplayerMp4.node.on('completed', this.playCompleted, this);
        this.videoplayerMp4.node.on('ready-to-play', this.loadCompleted, this);

        this.videoplayerMp4.node.on('playing', this.updateVideoState, this);
        this.videoplayerMp4.node.on('paused', this.updateVideoState, this);
        this.videoplayerMp4.node.on('stopped', this.updateVideoStateStop, this);

        this.videoPlayBtn.node.on(cc.Node.EventType.TOUCH_END,this.videoPlay,this)
     }

    start () {
        this.videoPlayBtn.node.active = true
        this.videoBg.node.active = false
        this.videoplayerMp4.node.setContentSize(cc.size(440,250))
        this.node.x = -cc.winSize.width / 2;
        this.node.y = -cc.winSize.height / 2;

        this.player.sceneMap = this;
        this.node.on(cc.Node.EventType.TOUCH_START,this.onMapMouseDown,this);
    }

    public init(mapData:MapData,bgTex:cc.Texture2D,targetPos,callback,mapLoadModel:MapLoadModel = 1)
    {
 
        //this._mapData = mapData;

        MapRoadUtils.instance.updateMapInfo(mapData.mapWidth,mapData.mapHeight,mapData.nodeWidth,mapData.nodeHeight,mapData.type);

        //初始化底图参数
        this._mapParams = new MapParams();
        this._mapParams.name = mapData.name;
        this._mapParams.bgName = mapData.bgName;
        this._mapParams.mapType = mapData.type;
        this._mapParams.mapWidth = mapData.mapWidth;
        this._mapParams.mapHeight = mapData.mapHeight;
        this._mapParams.ceilWidth = mapData.nodeWidth;
        this._mapParams.ceilHeight = mapData.nodeHeight;

        this._mapParams.viewWidth = mapData.mapWidth > cc.winSize.width ? cc.winSize.width : mapData.mapWidth;
        this._mapParams.viewHeight = mapData.mapHeight > cc.winSize.height ? cc.winSize.height : mapData.mapHeight;
        this._mapParams.sliceWidth = 256;
        this._mapParams.sliceHeight = 256;
        this._mapParams.bgTex = bgTex;
        this._mapParams.mapLoadModel = mapLoadModel;

        this._mapParams.birthPlace = mapData.birthPlace
        this._mapParams.transportData = mapData.transportData
        this._mapParams.heroScale = mapData.heroScale

        this.mapLayer.init(this._mapParams);
    
        var len:number = mapData.roadDataArr.length;
        var len2:number = mapData.roadDataArr[0].length;
        
        var value:number = 0;
        var dx:number = 0;
        var dy:number = 0;

        this._roadDic = {}

        for(var i:number = 0 ; i < len ; i++)
        {
            for(var j:number = 0 ; j < len2 ; j++)
            {
                value = mapData.roadDataArr[i][j];
                dx = j;
                dy = i;
                
                var node:RoadNode = MapRoadUtils.instance.getNodeByDerect(dx,dy);
                node.value = value;

                this._roadDic[dx + "_" + dy] = node;
            }
        }

        if(mapData.type == MapType.honeycomb)
        {
            this._roadSeeker = new AstarHoneycombRoadSeeker(this._roadDic)
        }else
        {
            this._roadSeeker = new AStarRoadSeeker(this._roadDic);
        }

        this.node.width = this.mapLayer.width;
        this.node.height = this.mapLayer.height;
        
        this.arriveCallBack = callback

        this.mapLayer.clear();
        this.initPlayerPos(targetPos)
        this.setViewToPlayer();
        this.setTransport()
        this.videoBg.node.active = this._mapParams.name == "room_1_1"
    }

    playCompleted()
    {
        this.videoplayerMp4.currentTime = 0
        this.videoBtnTx.string = "播放"
    }

    loadCompleted()
    {
        this.videoPlayBtn.node.active = true
    }

    videoPlay()
    {
        if(this.videoplayerMp4.isPlaying())
        {
            this.videoplayerMp4.pause()
        }
        else
        {
            this.videoplayerMp4.play()
            if(this.player)
            {
                this.player.stop()
            }
        }
        
    }

    updateVideoState()
    {
        var str = this.videoplayerMp4.isPlaying() ? "暂停":"播放";
        this.videoBtnTx.string = str
    }

    updateVideoStateStop()
    {
        this.videoBtnTx.string = "播放"
    }

    public setTransport()
    {

        for(var i = 0; i < this.transportNodes.length; i++)
        {
            this.transportNodes[i].active = false
        }

        for(var i = 0; i < this._mapParams.transportData.length; i++)
        {
            var node = this.transportNodes[i]
            if (node == null)
            {
                this.transportNode.active = false
                node = cc.instantiate(this.transportNode)
                node.parent = this.transportNode.parent
                this.transportNodes[i] = node
            }
            
            var data:TransportData = this._mapParams.transportData[i]
            var point:Point = MapRoadUtils.instance.getPixelByWorldPoint(data.pos[0],data.pos[1])
            node.setPosition(cc.v2(point.x,point.y))
            node.setScale(data.scale)

            //const 需要记录下，开始是var变量，导致下表为3的图片显示为room_trans，而实际上配置表中，只有下标为2的元素才是room_trans，
            //即：cc.loader.loadRes 中的sprite已经被改变了
            const sprite = node.getComponent(cc.Sprite);
            cc.loader.loadRes("ui/" + data.image,cc.Texture2D,(error:Error,tex:cc.Texture2D)=>
            {
                sprite.spriteFrame = new cc.SpriteFrame(tex)
            });
            node.active = true
        }
    }

    public 

    public callArriveFunc()
    {
        var curPos = this.player.node.getPosition()
        var point:Point = MapRoadUtils.instance.getWorldPointByPixel(curPos.x,curPos.y);
        
        var rangeDis:number = 0
        var transportName
        for(var i = 0; i < this._mapParams.transportData.length; i++)
        {
            var data:TransportData = this._mapParams.transportData[i]
            if(data.pos[0] == point.x && data.pos[1] == point.y)
            {
                transportName = data.targetMap
                break
            }
        }

        if(transportName != null && this.arriveCallBack != null)
        {
            this.arriveCallBack(transportName,data.targetPos)
        }
    
    }

    public inTransportRange()
    {
        var range:number = 0

    }

    public initPlayerPos(targetPos:number[])
    {
        this.entityLayer.node.active = true;        
        if(this.player)
        {
            this.player.stop()

            var birthPos:number[] = this._mapParams.birthPlace
            if(targetPos != null && targetPos.length == 2)
            {
                birthPos = targetPos
            }
        
            var point:Point = MapRoadUtils.instance.getPixelByWorldPoint(birthPos[0],birthPos[1])
            this.player.node.setPosition(cc.v2(point.x,point.y))

            this.player.node.scale = this._mapParams.heroScale
            this.player.movieClip.loadRes();
        }
    }

    public isSameNodeByPixel(pos: Vec2,targetPos: Vec2):boolean{

        var point1:Point = MapRoadUtils.instance.getWorldPointByPixel(pos.x,pos.y);
        var point2:Point = MapRoadUtils.instance.getWorldPointByPixel(targetPos.x,targetPos.y);

        return point1.x == point2.x && point1.y == point2.y
    }


    public getMapNodeByPixel(px:number,py:number):RoadNode
    {
        var point:Point = MapRoadUtils.instance.getWorldPointByPixel(px,py);
        
        var node:RoadNode = this._roadDic[point.x + "_" + point.y];
        
        return node;
    }


    public onMapMouseDown(event:cc.Event.EventTouch):void
    {
       if(this.videoplayerMp4.isPlaying())
       {
           return;
       }
        //var pos = this.node.convertToNodeSpaceAR(event.getLocation());
        var pos = this.camera.node.position.add(event.getLocation());

        this.movePlayer(pos.x,pos.y);

    }

    /**
     * 视图跟随玩家
     * @param dt 
     */
    public followPlayer(dt:number)
    {
        this.targetPos = this.player.node.position.sub(cc.v2(cc.winSize.width / 2,cc.winSize.height / 2));

        if(this.targetPos.x > this._mapParams.mapWidth - cc.winSize.width)
        {
            this.targetPos.x = this._mapParams.mapWidth - cc.winSize.width;
        }else if(this.targetPos.x < 0)
        {
            this.targetPos.x = 0;
            
        }    

        if(this.targetPos.y > this._mapParams.mapHeight - cc.winSize.height)
        {
            this.targetPos.y = this._mapParams.mapHeight - cc.winSize.height;
        }else if(this.targetPos.y < 0)
        {
            this.targetPos.y = 0;
        }
        

        //摄像机平滑跟随
        this.camera.node.position.lerp(this.targetPos,dt * 2.0,this.targetPos);
        this.camera.node.position = this.targetPos;

        if(this._mapParams.mapLoadModel == MapLoadModel.slices)
        {
            this.mapLayer.loadSliceImage(this.targetPos.x,this.targetPos.y);
        }
        
    }

    /**
        *移到玩家 
        * @param targetX 移动到的目标点x
        * @param targetY 移到到的目标点y
        * 
        */	
    public movePlayer(targetX:number,targetY:number)
    {
        
        var startPoint:Point = MapRoadUtils.instance.getWorldPointByPixel(this.player.node.x,this.player.node.y);
        var targetPoint:Point = MapRoadUtils.instance.getWorldPointByPixel(targetX,targetY);

        var startNode:RoadNode = this._roadDic[startPoint.x + "_" + startPoint.y];
        var targetNode:RoadNode = this._roadDic[targetPoint.x + "_" + targetPoint.y];
        
        console.log("move Player1:"  + " startNode:"+startNode.toString() + "target:" + targetNode.toString());

        var roadNodeArr:RoadNode[] = this._roadSeeker.seekPath(startNode,targetNode); //点击到障碍点不会行走
        //var roadNodeArr:RoadNode[] = this._roadSeeker.seekPath2(startNode,targetNode);  //点击到障碍点会行走到离障碍点最近的可走路点

        console.log("move Player2:" +roadNodeArr.length);
        if(roadNodeArr.length > 0)
        {
            this.player.walkByRoad(roadNodeArr);
        }
    }


    /**
     *把视野定位到给定位置 
    * @param px
    * @param py
    * 
    */		
    public setViewToPoint(px:number,py:number):void
    {
        this.targetPos = cc.v2(px,py).sub(cc.v2(cc.winSize.width / 2,cc.winSize.height / 2));

        if(this.targetPos.x > this._mapParams.mapWidth - cc.winSize.width)
        {
            this.targetPos.x = this._mapParams.mapWidth - cc.winSize.width;
        }else if(this.targetPos.x < 0)
        {
            this.targetPos.x = 0;
            
        }    

        if(this.targetPos.y > this._mapParams.mapHeight - cc.winSize.height)
        {
            this.targetPos.y = this._mapParams.mapHeight - cc.winSize.height;
        }else if(this.targetPos.y < 0)
        {
            this.targetPos.y = 0;
        }
        
        this.camera.node.position = this.targetPos;
        
        if(this._mapParams.mapLoadModel == MapLoadModel.slices)
        {
            this.mapLayer.loadSliceImage(this.targetPos.x,this.targetPos.y);
        }
    }
    
    /**
     * 将视野对准玩家
     */
    public setViewToPlayer():void
    {
        this.setViewToPoint(this.player.node.x,this.player.node.y);
    }

    update (dt) 
    {
        if(this.isFollowPlayer)
        {
            this.followPlayer(dt);
            //this.camera.node.position = this.player.node.position.sub(cc.v2(cc.winSize.width / 2,cc.winSize.height / 2));
        }

    }
}
