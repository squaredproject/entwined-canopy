(function(e){function t(t){for(var r,s,a=t[0],u=t[1],c=t[2],d=0,h=[];d<a.length;d++)s=a[d],Object.prototype.hasOwnProperty.call(i,s)&&i[s]&&h.push(i[s][0]),i[s]=0;for(r in u)Object.prototype.hasOwnProperty.call(u,r)&&(e[r]=u[r]);l&&l(t);while(h.length)h.shift()();return o.push.apply(o,c||[]),n()}function n(){for(var e,t=0;t<o.length;t++){for(var n=o[t],r=!0,a=1;a<n.length;a++){var u=n[a];0!==i[u]&&(r=!1)}r&&(o.splice(t--,1),e=s(s.s=n[0]))}return e}var r={},i={app:0},o=[];function s(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,s),n.l=!0,n.exports}s.m=e,s.c=r,s.d=function(e,t,n){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},s.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(s.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)s.d(n,r,function(t){return e[t]}.bind(null,r));return n},s.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="/";var a=window["webpackJsonp"]=window["webpackJsonp"]||[],u=a.push.bind(a);a.push=t,a=a.slice();for(var c=0;c<a.length;c++)t(a[c]);var l=u;o.push([0,"chunk-vendors"]),n()})({0:function(e,t,n){e.exports=n("56d7")},"034f":function(e,t,n){"use strict";n("85ec")},3014:function(e){e.exports=JSON.parse('[{"id":0,"ry":70,"x":-290.64,"z":441.77},{"id":1,"ry":100,"x":-587.09,"z":145.32},{"id":2,"ry":90,"x":-227.06,"z":145.3},{"id":3,"ry":150,"x":-595.8,"z":-154.4},{"id":4,"ry":180,"x":-299.7,"z":-236.1},{"id":5,"ry":-110,"x":86.3,"z":-540.4},{"id":6,"ry":-90,"x":218,"z":-258.8},{"id":7,"ry":-60,"x":585.8,"z":-172.6},{"id":8,"ry":-90,"x":694.8,"z":-472.3},{"id":9,"ry":180,"x":-467.7,"z":-776.6},{"id":10,"ry":200,"x":-376.9,"z":-1089.9},{"id":11,"ry":-120,"x":36.3,"z":-917.3},{"id":12,"ry":-90,"x":190.7,"z":-1126.2},{"id":13,"ry":-120,"x":95.4,"z":-1362.4},{"id":14,"ry":-20,"x":971.8,"z":54.5},{"id":15,"ry":-20,"x":590.4,"z":354.2},{"id":16,"ry":0,"x":472.3,"z":590.4},{"id":17,"ry":-20,"x":944.6,"z":617.6},{"id":18,"ry":-30,"x":1121.7,"z":332.4},{"id":19,"ry":-30,"x":1389.6,"z":354.2}]')},"56d7":function(e,t,n){"use strict";n.r(t);n("e260"),n("e6cf"),n("cca6"),n("a79d");var r=n("2b0e"),i=n("f87c"),o=n("8e27"),s=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{attrs:{id:"app"}},[n("router-view")],1)},a=[],u=(n("034f"),n("2877")),c={},l=Object(u["a"])(c,s,a,!1,null,null,null),d=l.exports,h=n("8c4f"),f=function(){var e=this,t=e.$createElement;e._self._c;return e._m(0)},p=[function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{staticClass:"home"},[n("h1",[e._v("Entwined Meadow")]),n("p",[e._v("This is the interactive web app for Entwined Meadow, a new art installation in San Francisco, CA.")]),n("p",[e._v('To get started, scan one of the QR codes that are attached to each of the glowing "shrubs".')])])}],b={name:"Home"},m=b,v=Object(u["a"])(m,f,p,!1,null,null,null),g=v.exports,y=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{staticClass:"shrub"},["active"===e.state?n("ShrubControlPanel",{attrs:{shrubId:e.shrubId,sessionExpiryDate:e.sessionExpiryDate}}):e._e(),"waiting"===e.state?n("ShrubWaitingScreen",{attrs:{shrubId:e.shrubId,estimatedWaitTime:e.estimatedWaitTime}}):e._e(),"offered"===e.state?n("ShrubOfferScreen",{attrs:{shrubId:e.shrubId,offerExpiryDate:e.offerExpiryDate}}):e._e(),"loading"===e.state?n("p",[e._v("Loading shrub interactivity...")]):e._e()],1)},x=[],S=(n("99af"),n("caad"),n("d81d"),n("2532"),n("6821")),w=n.n(S),_=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("div",[n("input",{directives:[{name:"model",rawName:"v-model",value:e.hue,expression:"hue"}],attrs:{type:"range",id:"hue",name:"hue",min:"0",max:"100"},domProps:{value:e.hue},on:{__r:function(t){e.hue=t.target.value}}}),n("label",{attrs:{for:"hue"}},[e._v("Hue Shift")])]),n("div",[n("input",{directives:[{name:"model",rawName:"v-model",value:e.saturation,expression:"saturation"}],attrs:{type:"range",id:"saturation",name:"saturation",min:"0",max:"100"},domProps:{value:e.saturation},on:{__r:function(t){e.saturation=t.target.value}}}),n("label",{attrs:{for:"saturation"}},[e._v("Saturation")])]),n("div",[n("input",{directives:[{name:"model",rawName:"v-model",value:e.brightness,expression:"brightness"}],attrs:{type:"range",id:"brightness",name:"brightness",min:"0",max:"100"},domProps:{value:e.brightness},on:{__r:function(t){e.brightness=t.target.value}}}),n("label",{attrs:{for:"brightness"}},[e._v("Brightness")])]),n("div",[n("input",{directives:[{name:"model",rawName:"v-model",value:e.colorCloud,expression:"colorCloud"}],attrs:{type:"range",id:"colorCloud",name:"colorCloud",min:"0",max:"100"},domProps:{value:e.colorCloud},on:{__r:function(t){e.colorCloud=t.target.value}}}),n("label",{attrs:{for:"colorCloud"}},[e._v("Color Cloud")])]),n("div",{staticClass:"one-shot-triggers"},[n("a",{attrs:{href:"#"},on:{click:function(t){return e.runOneShotTriggerable("lightning")}}},[e._v("⚡️")]),n("a",{attrs:{href:"#"},on:{click:function(t){return e.runOneShotTriggerable("rain")}}},[e._v("🌧")]),n("a",{attrs:{href:"#"},on:{click:function(t){return e.runOneShotTriggerable("bass-slam")}}},[e._v("🚨")]),n("a",{attrs:{href:"#"},on:{click:function(t){return e.runOneShotTriggerable("color-burst")}}},[e._v("🌈")])]),n("div",[n("span",[e._v(e._s(e.$socket.connected?"Connected":"Disconnected"))])]),n("div",[n("span",[e._v(e._s(e.sessionTimeRemainingString)+" remaining in session")])]),n("div",[n("a",{attrs:{href:"#"},on:{click:e.stopControlling}},[e._v("Stop Controlling")])])])},I=[],T=n("c46f"),O=function(e){return T["a"].throttle((function(t){this.$socket.client.emit("updateShrubSetting",{shrubId:this.shrubId,key:e,value:t})}),150)},D={name:"ShrubControlPanel",props:["shrubId","sessionExpiryDate"],data:function(){return{hue:50,saturation:50,brightness:50,colorCloud:50,nowTimestamp:Date.now(),nowInterval:null}},created:function(){var e=this;this.nowInterval=setInterval((function(){e.nowTimestamp=Date.now()}),250)},computed:{sessionTimeRemainingString:function(){if(!this.sessionExpiryDate)return"00:00";var e=Math.max(this.sessionExpiryDate.getTime()-this.nowTimestamp,0);return new Date(e).toISOString().substr(14,5)}},watch:{hue:O("hue"),saturation:O("saturation"),brightness:O("brightness"),colorCloud:O("colorCloud")},methods:{runOneShotTriggerable:function(e){this.$socket.client.emit("runOneShotTriggerable",{shrubId:this.shrubId,triggerableName:e})},stopControlling:function(){this.$socket.client.emit("deactivateSession",this.shrubId),this.$router.push("/")}}},C=D,E=Object(u["a"])(C,_,I,!1,null,"19e49044",null),k=E.exports,W=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("h1",[e._v("Waiting to Interact")]),n("p",[e._v("Somebody else is controlling the shrub right now. Hang out and enjoy Entwined while waiting for your turn.")]),e.estimatedWaitString?n("p",[e._v("Your estimated wait time is "+e._s(e.estimatedWaitString)+".")]):e._e()])},z=[],$={name:"ShrubWaitingScreen",props:["shrubId","estimatedWaitTime"],computed:{estimatedWaitString:function(){return this.estimatedWaitTime?this.estimatedWaitTime<30?"less than a minute":this.estimatedWaitTime<90?"one minute":"".concat(Math.round(this.estimatedWaitTime/60)," minutes"):"unknown"}}},j=$,P=Object(u["a"])(j,W,z,!1,null,"c646da68",null),M=P.exports,A=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",[n("h1",[e._v("Your spot is up!")]),n("p",[e._v("It's your turn to control the shrub!")]),n("button",{attrs:{type:"button"},on:{click:e.acceptOffer}},[e._v("Start Controlling")]),n("button",{attrs:{type:"button"},on:{click:e.declineOffer}},[e._v("Decline Control")]),n("p",[e._v("You have "+e._s(e.offerTimeRemainingString)+" to start controlling before we'll move on to the next person in line.")])])},R=[],U={name:"ShrubOfferScreen",props:["shrubId","offerExpiryDate"],data:function(){return{nowTimestamp:Date.now(),nowInterval:null}},created:function(){var e=this;this.nowInterval=setInterval((function(){e.nowTimestamp=Date.now()}),250)},beforeDestroy:function(){this.nowInterval&&(clearInterval(this.nowInterval),this.nowInterval=null)},computed:{offerTimeRemainingString:function(){if(!this.offerExpiryDate)return"0 seconds";var e=Math.max(this.offerExpiryDate.getTime()-this.nowTimestamp,0);return"".concat(Math.round(e/1e3)," seconds")}},methods:{declineOffer:function(){this.$socket.client.emit("declineOfferedSession",this.shrubId),this.$router.push("/")},acceptOffer:function(){this.$socket.client.emit("acceptOfferedSession",this.shrubId)}}},B=U,F=Object(u["a"])(B,A,R,!1,null,"1d72fa32",null),N=F.exports,H=n("b05c"),K=n.n(H),J=n("3014").map((function(e){return String(e.id)}));function Y(e){var t=e.params.shrubId,n=e.query.key;if(!J.includes(t))return console.log("Shrub ID ".concat(t," is not a valid shrub.")),!1;var r=w()(t+K.a.shrubKeySalt);return r===n||(console.log("Access key ".concat(n," is incorrect.")),!1)}var q={name:"Shrub",props:["shrubId","accessKey"],data:function(){return{state:"loading",estimatedWaitTime:0,offerExpiryDate:null,sessionExpiryDate:null}},sockets:{connect:function(){console.log("Shrub.vue socket connected")},sessionActivated:function(e){e.shrubId===this.shrubId?(this.state="active",this.sessionExpiryDate=new Date(e.expiryDate),console.log("Shrub.vue session activated")):console.log("Unexpected event for shrub ".concat(e.shrubId," (shrub ").concat(this.shrubId," is loaded)."))},sessionDeactivated:function(e){e===this.shrubId?(this.state="loading",this.$router.push("/"),console.log("Shrub.vue session deactivated")):console.log("Unexpected event for shrub ".concat(e," (shrub ").concat(this.shrubId," is loaded)."))},sessionWaiting:function(e){e.shrubId===this.shrubId?(this.state="waiting",this.estimatedWaitTime=e.estimatedWaitTime,console.log("Shrub.vue session waiting, est wait "+this.estimatedWaitTime)):console.log("Unexpected event for shrub ".concat(e.shrubId," (shrub ").concat(this.shrubId," is loaded)."))},sessionOffered:function(e){e.shrubId===this.shrubId?(this.state="offered",this.offerExpiryDate=new Date(e.offerExpiryDate),console.log("Shrub.vue session offered")):console.log("Unexpected event for shrub ".concat(e.shrubId," (shrub ").concat(this.shrubId," is loaded)."))},sessionOfferRevoked:function(e){e===this.shrubId?(this.state="waiting",console.log("Shrub.vue session offer revoked")):console.log("Unexpected event for shrub ".concat(e," (shrub ").concat(this.shrubId," is loaded)."))},waitTimeUpdated:function(e){e.shrubId===this.shrubId?(this.state="waiting",this.estimatedWaitTime=e.estimatedWaitTime,console.log("Shrub.vue wait time updated to "+this.estimatedWaitTime)):console.log("Unexpected event for shrub ".concat(e.shrubId," (shrub ").concat(this.shrubId," is loaded)."))}},beforeRouteEnter:function(e,t,n){Y(e)?n():n("/")},beforeMount:function(){this.$socket.client.emit("activateSession",this.shrubId)},components:{ShrubControlPanel:k,ShrubWaitingScreen:M,ShrubOfferScreen:N}},L=q,Q=Object(u["a"])(L,y,x,!1,null,null,null),G=Q.exports;r["a"].use(h["a"]);var V=[{path:"*",name:"Home",component:g},{path:"/shrubs/:shrubId",name:"Shrub",component:G,props:function(e){return{shrubId:e.params.shrubId,accessKey:e.query.key}}}],X=new h["a"]({mode:"history",base:"/",routes:V}),Z=X,ee=K.a.prodWebSocketAPI;r["a"].config.productionTip=!1,r["a"].use(i["a"],Object(o["io"])(ee)),new r["a"]({router:Z,render:function(e){return e(d)}}).$mount("#app")},"85ec":function(e,t,n){},b05c:function(e,t){e.exports={shrubKeySalt:"5D805F8816BBB020DC9C43FA4E74173B5C8C910E44A4E2F78DE5FD59CC7B11F1",prodWebSocketAPI:"http://entwined-canopy.herokuapp.com"}}});
//# sourceMappingURL=app.e1e9baae.js.map