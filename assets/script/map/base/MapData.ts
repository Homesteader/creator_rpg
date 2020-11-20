import { MapType } from "./MapType";
import { TransportData } from "./TransportData";

export default class MapData {

    public name:string = "";
    public bgName:string = "";
    public type:MapType = MapType.angle45;
    public mapWidth:number = 0;
    public mapHeight:number = 0;
    public nodeWidth:number = 0; 
    public nodeHeight:number = 0;
    public transport:number[] = [];
    public transportData:TransportData[] = [];
    public birthPlace:number[] = [];
    public targetMap:string = "";
    public roadDataArr:number[][] = [];
    //public row:number = 0;
    //public col:number = 0;

    public mapItem:object[] = [];


}
