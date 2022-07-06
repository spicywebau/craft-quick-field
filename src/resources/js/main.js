(()=>{"use strict";var t={304:(t,e,i)=>{Object.defineProperty(e,"__esModule",{value:!0});const n=i(311);e.default=Garnish.Modal.extend({$body:null,$content:null,$main:null,$footer:null,$leftButtons:null,$rightButtons:null,$deleteBtn:null,$saveBtn:null,$cancelBtn:null,$saveSpinner:null,$deleteSpinner:null,$loadSpinner:null,$html:null,$js:null,$css:null,$currentHtml:null,$currentJs:null,$currentCss:null,$observed:null,observer:null,executedJs:null,loadedCss:null,templateLoaded:!1,init:function(t){this.base(),this.setSettings(t,{resizable:!0}),this.$currentHtml=n(),this.$currentJs=n(),this.$currentCss=n(),this.$observed=n(),this.executedJs={},this.loadedCss={},this.observer=new window.MutationObserver((t=>{for(let e=0;e<t.length;e++)this.$observed=this.$observed.add(t[e].addedNodes)}));const e=n('<form class="modal quick-field-modal" style="display: none; opacity: 0;">').appendTo(Garnish.$bod);this.$body=n('<div class="body">').appendTo(e),this.$content=n('<div class="content">').appendTo(this.$body),this.$main=n('<div class="main">').appendTo(this.$content),this.$footer=n('<div class="footer">').appendTo(e),this.$loadSpinner=n('<div class="spinner big">').appendTo(e),this.$leftButtons=n('<div class="buttons left">').appendTo(this.$footer),this.$rightButtons=n('<div class="buttons right">').appendTo(this.$footer),this.$deleteBtn=n('<a class="delete error hidden">').text(Craft.t("quick-field","Delete")).appendTo(this.$leftButtons),this.$deleteSpinner=n('<div class="spinner hidden">').appendTo(this.$leftButtons),this.$cancelBtn=n('<div class="btn disabled" role="button">').text(Craft.t("quick-field","Cancel")).appendTo(this.$rightButtons),this.$saveBtn=n('<div class="btn submit disabled" role="button">').text(Craft.t("quick-field","Save")).appendTo(this.$rightButtons),this.$saveSpinner=n('<div class="spinner hidden">').appendTo(this.$rightButtons),this.setContainer(e)},initTemplate:function(t){if(this.templateLoaded)return;const e=t=>{this.$html=t.$html,this.$js=t.$js,this.$css=t.$css,this.templateLoaded=!0,this.initListeners(),this.visible&&this.initSettings(),this.off("parseTemplate",e)};this.on("parseTemplate",e),this.parseTemplate(t)},parseTemplate:function(t){const e=Garnish.$doc.find("head"),i=n(t.html),s=n(t.js).filter("script"),r=n(t.css).filter("style, link"),d=r.filter("link").prop("async",!0),a=r.filter("style");d.each(((t,i)=>{const n=i.prop("href");void 0===this.loadedCss[n]&&(e.append(i),this.loadedCss[n]=i)}));const l=s.filter("[src]"),o=s.filter(":not([src])"),u=[];l.each(((t,e)=>{const i=e.prop("src");void 0===this.executedJs[i]&&(u.push(i),this.executedJs[i]=!0)}));const h=()=>{this.off("runExternalScripts",h),this.trigger("parseTemplate",{target:this,$html:i,$js:o,$css:a})};this.on("runExternalScripts",h),this.runExternalScripts(u)},runExternalScripts:function(t){let e=t.length;if(e>0)for(let i=0;i<t.length;i++){const s=t[i];n.getScript(s).done(((t,i)=>{"success"===i?(e--,0===e&&this.trigger("runExternalScripts",{target:this})):Craft.cp.displayError(Craft.t("quick-field","Could not load all resources."))})).catch((()=>Craft.cp.displayError(Craft.t("quick-field","Could not load all resources."))))}else this.trigger("runExternalScripts",{target:this})},initListeners:function(){this.$cancelBtn.removeClass("disabled"),this.$saveBtn.removeClass("disabled"),this.addListener(this.$cancelBtn,"activate","closeModal"),this.addListener(this.$saveBtn,"activate","saveField"),this.addListener(this.$deleteBtn,"activate","deleteField"),this.on("show",this.initSettings),this.on("fadeOut",this.destroySettings),this.enable()},destroyListeners:function(){this.$cancelBtn.addClass("disabled"),this.$saveBtn.addClass("disabled"),this.removeListener(this.$cancelBtn,"activate"),this.removeListener(this.$saveBtn,"activate"),this.removeListener(this.$deleteBtn,"activate"),this.off("show",this.initSettings),this.off("fadeOut",this.destroySettings),this.disable()},initSettings:function(t){var e,i,s,r;const d=null!==(e=null==t?void 0:t.target)&&void 0!==e?e:this;if(!d.templateLoaded)return;d.$currentHtml=null!==(i=null==t?void 0:t.$html)&&void 0!==i?i:d.$html.clone(),d.$currentJs=null!==(s=null==t?void 0:t.$js)&&void 0!==s?s:d.$js.clone(),d.$currentCss=null!==(r=null==t?void 0:t.$css)&&void 0!==r?r:d.$css.clone(),d.$observed=n(),d.observer.observe(Garnish.$bod[0],{childList:!0,subtree:!1}),d.$main.append(d.$currentHtml),Garnish.$bod.append(d.$currentJs);const a=d.$main.find('input[name="qf[fieldId]"]');d.$deleteBtn.toggleClass("hidden",0===a.length),Craft.initUiElements();const l=()=>{d.off("runExternalScripts",l),setTimeout((()=>d.observer.disconnect()),1)};d.on("runExternalScripts",l),d.runExternalScripts(Object.keys(d.executedJs))},destroySettings:function(t){var e;const i=null!==(e=null==t?void 0:t.target)&&void 0!==e?e:this;i.$currentHtml.remove(),i.$currentJs.remove(),i.$currentCss.remove(),i.$observed.remove(),i.$deleteBtn.addClass("hidden")},closeModal:function(){this.hide()},editField:function(t){this.destroyListeners(),this.show(),this.initListeners(),this.$loadSpinner.removeClass("hidden");const e={fieldId:t};Craft.sendActionRequest("POST","quick-field/actions/edit-field",{data:e}).then((t=>{const e=t=>{this.destroySettings(),this.initSettings(t),this.off("parseTemplate",e)};this.on("parseTemplate",e),this.parseTemplate(t.data.template)})).catch((t=>{var e;Craft.cp.displayError(null!==(e=t.error)&&void 0!==e?e:Craft.cp.displayError(Craft.t("quick-field","An unknown error occurred."))),this.hide()})).finally((()=>this.$loadSpinner.addClass("hidden")))},saveField:function(t){if(null==t||t.preventDefault(),this.$saveBtn.hasClass("disabled")||!this.$saveSpinner.hasClass("hidden"))return;this.destroyListeners(),this.$saveSpinner.removeClass("hidden");const e=this.$container.serialize(),i=this.$container.find('input[name="qf[fieldId]"]'),n=i.length>0?i.val():null;Craft.sendActionRequest("POST","quick-field/actions/save-field",{data:e}).then((t=>{this.initListeners();const e={target:this,field:t.data.field,elementSelector:t.data.elementSelector};null===n?(this.trigger("newField",e),Craft.cp.displayNotice(Craft.t("quick-field","New field created."))):(this.trigger("saveField",e),Craft.cp.displayNotice(Craft.t("quick-field","'{name}' field saved.",{name:t.data.field.name}))),this.hide()})).catch((t=>{if(null!==t.data.template)if(this.visible){const e=t=>{this.initListeners(),this.destroySettings(),this.initSettings(t),this.off("parseTemplate",e)};this.on("parseTemplate",e),this.parseTemplate(t.data.template),Garnish.shake(this.$container)}else this.initListeners();else this.initListeners(),Craft.cp.displayError(Craft.t("quick-field","An unknown error occurred."))})).finally((()=>this.$saveSpinner.addClass("hidden")))},deleteField:function(t){if(null==t||t.preventDefault(),!this.$deleteBtn.hasClass("disabled")&&this.$deleteSpinner.hasClass("hidden")&&this.promptForDelete()){this.destroyListeners(),this.$deleteSpinner.removeClass("hidden");const t=this.$container.find('input[name="qf[fieldId]"]'),e=t.length>0?t.val():null;if(null===e)return void Craft.cp.displayError(Craft.t("quick-field","An unknown error occurred."));const i={fieldId:e};Craft.sendActionRequest("POST","quick-field/actions/delete-field",{data:i}).then((t=>{this.initListeners(),this.trigger("deleteField",{target:this,field:t.data.field}),Craft.cp.displayNotice(Craft.t("quick-field","'{name}' field deleted.",{name:t.data.field.name})),this.hide()})).catch((t=>{var e;Craft.cp.displayError(null!==(e=t.error)&&void 0!==e?e:Craft.cp.displayError(Craft.t("quick-field","An unknown error occurred."))),this.hide()})).finally((()=>this.$deleteSpinner.addClass("hidden")))}},promptForDelete:function(){return confirm(Craft.t("quick-field","Are you sure you want to delete this field?"))},hide:function(){this._disabled||this.base()},destroy:function(){this.base(),this.destroyListeners(),this.destroySettings(),this.$shade.remove(),this.$container.remove(),this.trigger("destroy")}})},363:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.default=Garnish.Base.extend({quickField:null,init:function(t){this.quickField=t},addNewGroup:function(){this._saveGroup(null,"",this._triggerGroupUpdateEvent("newGroup"))},renameGroup:function(t,e){this._saveGroup(t,e,this._triggerGroupUpdateEvent("renameGroup"))},_saveGroup:function(t,e,i){const n=this.promptForGroupName(e);if(""!==n){const s={name:n,id:t};Craft.sendActionRequest("POST","fields/save-group",{data:s}).then((t=>i(this,t.data.group,e))).catch((t=>{if(t.errors.length>0){const e=this._flattenErrors(t.errors);alert(`${Craft.t("quick-field","Could not save the group:")}\n\n${e.join("\n")}`)}else Craft.cp.displayError(Craft.t("quick-field","An unknown error occurred."))}))}},_triggerGroupUpdateEvent:function(t){return function(e,i,n){e.trigger(t,{target:e,group:i,oldName:n})}},deleteGroup:function(t){if(confirm(Craft.t("quick-field","Are you sure you want to delete this group and all its fields?"))){const e={id:t};Craft.sendActionRequest("POST","fields/delete-group",{data:e}).then((e=>this.trigger("deleteGroup",{id:t}))).catch((t=>Craft.cp.displayError(Craft.t("quick-field","Could not delete the group."))))}},promptForGroupName:function(t){return prompt(Craft.t("quick-field","What do you want to name the group?"),t)},_flattenErrors:function(t){return Object.keys(t).reduce(((e,i)=>e.concat(t[i])),[])}})},451:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.default=Garnish.Base.extend({UNLOADED:"unloaded",LOADING:"loading",LOADED:"loaded",loadStatus:null,init:function(){this.loadStatus=this.UNLOADED,this.load()},load:function(){this.loadStatus===this.UNLOADED&&(this.loadStatus=this.LOADING,Craft.sendActionRequest("POST","quick-field/actions/load",{}).then((t=>{this.loadStatus=this.LOADED,this.trigger("load",{template:t.data.template,groups:t.data.groups})})).catch((t=>{this.loadStatus=this.UNLOADED,this.trigger("unload")})))}})},182:(t,e,i)=>{Object.defineProperty(e,"__esModule",{value:!0});const n=i(311),s=i(304),r=i(363),d=i(451),a=Garnish.Base.extend({$container:null,$groupButton:null,$fieldButton:null,$settings:null,fld:null,dialog:null,modal:null,init:function(t){this.fld=t,this.fld.$container.addClass("quick-field"),this.$container=n('<div class="newfieldbtn-container btngroup small fullwidth">').prependTo(t.$fieldLibrary),this.$groupButton=n('<div class="btn small add icon" tabindex="0">').text(Craft.t("quick-field","New Group")).appendTo(this.$container),this.$fieldButton=n('<div class="btn small add icon" tabindex="0">').text(Craft.t("quick-field","New Field")).appendTo(this.$container);let e=!0;this.initButtons(),this.dialog=new r.default,this.modal=new s.default,this.loader=new d.default,this.addListener(this.$groupButton,"activate","newGroup"),this.addListener(this.$fieldButton,"activate","newField"),this.dialog.on("newGroup",(t=>{const i=t.group;this.addGroup(i,!0),this._getGroupByName(i.name).data("id",t.group.id),this.loader.loadStatus===this.loader.UNLOADED?this.loader.load():e||(this.$fieldButton.appendTo(this.$container),e=!0)})),this.dialog.on("renameGroup",(t=>this.renameGroup(t.group,t.oldName))),this.dialog.on("deleteGroup",(t=>{this.removeGroup(t.id),0===this.fld.$fieldGroups.not(".hidden").length&&(this.$fieldButton.detach(),e=!1)})),this.modal.on("newField",(t=>this.addField(t.field,t.elementSelector))),this.modal.on("saveField",(t=>this.resetField(t.field,t.elementSelector))),this.modal.on("deleteField",(t=>this.removeField(t.field.id))),this.modal.on("destroy",(()=>{this.$fieldButton.detach(),e=!1})),this.loader.on("load",(t=>{this.modal.$loadSpinner.addClass("hidden"),this.modal.initTemplate(t.template),this._initGroups(t.groups),e||(this.$fieldButton.appendTo(this.$container),e=!0)})),this.loader.on("unload",(()=>this.modal.destroy())),this._groupObserver=new window.MutationObserver((()=>{this.fld.$fieldGroups.filter((function(){var t;return null!==(t=n(this).data("id"))&&void 0!==t&&t})).removeClass("hidden")})),this._groupObserver.observe(this.fld.$fieldLibrary[0],{attributes:!0,childList:!0,subtree:!0})},_initGroups:function(t){for(let e=t.length-1;e>=0;e--){const i=t[e];let n=this._getGroupByName(i.name);0===n.length&&(this.addGroup(i,!1),n=this._getGroupByName(i.name)),n.data("id",i.id)}this._resetFldGroups()},initButtons:function(){const t=this.fld.$fieldGroups,e=this.fld.$fields.filter(".unused");t.each(((t,e)=>this._addGroupMenu(n(e)))),e.each(((t,e)=>this._addFieldButton(n(e))))},_addGroupMenu:function(t){const e=n('<button class="qf-settings icon menubtn" title="'+Craft.t("quick-field","Settings")+'" role="button" type="button"></button>'),i=n(['<div class="menu">','<ul class="padded">','<li><a data-icon="edit" data-action="rename">',Craft.t("quick-field","Rename"),"</a></li>",'<li><a class="error" data-icon="remove" data-action="delete">',Craft.t("quick-field","Delete"),"</a></li>","</ul>","</div>"].join(""));t.prepend(i).prepend(e),new Garnish.MenuBtn(e).on("optionSelect",(e=>{switch(n(e.option).attr("data-action")){case"rename":this._openRenameGroupDialog(t);break;case"delete":this._openDeleteGroupDialog(t)}}))},_addFieldButton:function(t){const e=n('<a class="qf-edit icon" title="Edit"></a>');this.addListener(e,"activate","editField"),t.prepend(e)},newField:function(){this.modal.show()},editField:function(t){const e=n(t.target).parent().data("id");this.modal.editField(e)},addField:function(t,e){const i=this._getGroupByName(t.group.name);null!==i?this._insertFieldElementIntoGroup(t,n(e),i):Craft.cp.displayError(Craft.t("quick-field","Invalid field group: {groupName}",{groupName:t.group.name}))},_insertFieldElementIntoGroup:function(t,e,i){const s=this.fld,r=t.name.toLowerCase();let d=i.children(".fld-element").filter((function(){return n(this).find("h4").text().toLowerCase()<r})).last();0===d.length&&(d=i.children("h6")),e.insertAfter(d),s.elementDrag.addItems(e),this._addFieldButton(e),s.$fields=s.$fieldGroups.children(".fld-element")},removeField:function(t){const e=this.fld,i=e.$fields,n=i.filter(`.fld-field[data-id="${t}"]`);n.remove(),e.$fields=i.not(n),e.elementDrag.removeItems(n)},resetField:function(t,e){const i=this.fld,s=this._getGroupByName(t.group.name),r=i.$fields.filter(`[data-id="${t.id}"]`);i.elementDrag.removeItems(r),r.remove(),this._insertFieldElementIntoGroup(t,n(e),s)},newGroup:function(){this.dialog.addNewGroup()},addGroup:function(t,e){const i=t.name,s=i.toLowerCase(),r=n(['<div class="fld-field-group" data-name="',s,'">',"<h6>",i,"</h6>","</div>"].join(""));this._addGroupMenu(r),this._attachGroup(r,e),null!==this.modal.$html&&this._addOptionToGroupSelect(n(`<option value="${t.id}">${i}</option>`),this.modal.$html.find("#qf-group"),i)},_openRenameGroupDialog:function(t){const e=t.data("id"),i=t.children("h6").text();this.dialog.renameGroup(e,i)},renameGroup:function(t,e){const i=this._getGroupByName(e),s=t.name;if(i.length>0){const t=s.toLowerCase();i.detach().attr("data-name",t).data("name",t).children("h6").text(s),this._attachGroup(i,!0)}const r=this.modal.$html.find("#qf-group"),d=r.children().filter((function(){return n(this).text()===e})).detach().text(s);this._addOptionToGroupSelect(d,r,s)},_addOptionToGroupSelect:function(t,e,i){const s=e.children().filter((function(){return n(this).text().toLowerCase()<i.toLowerCase()})).last();s.length>0?t.insertAfter(s):t.prependTo(e)},_openDeleteGroupDialog:function(t){const e=t.data("id");this.dialog.deleteGroup(e)},removeGroup:function(t){const e=this.fld,i=e.$fieldGroups.filter((function(){return n(this).data("id")===t})),s=i.find(".fld-field.hidden").map(((t,e)=>`[data-id="${e.data("id")}"]`)).get().join(",");e.$tabContainer.find(".fld-field").filter(s).remove(),i.remove(),this._resetFldGroups(),this.modal.$html.find("#qf-group").children(`[value="${t}"]`).remove()},_attachGroup:function(t,e){const i=this.fld,s=t.attr("data-name");let r=i.$fieldGroups.filter((function(){const t=n(this);return t.hasClass("hidden")||t.data("name")<s})).last();0===r.length&&(r=i.$fieldSearch.parent()),t.insertAfter(r),e&&this._resetFldGroups()},_resetFldGroups:function(){this.fld.$fieldGroups=this.fld.$sidebar.find(".fld-field-group")},_getGroupByName:function(t){return this.fld.$sidebar.find(".fld-field-group").filter(`[data-name="${t.toLowerCase()}"]`)}});e.default=a},311:t=>{t.exports=jQuery}},e={};function i(n){var s=e[n];if(void 0!==s)return s.exports;var r=e[n]={exports:{}};return t[n](r,r.exports,i),r.exports}(()=>{const t=i(182),e=Craft.FieldLayoutDesigner,n=e.prototype.init;e.prototype.init=function(){n.apply(this,arguments),!0===this.$container.is(".layoutdesigner")&&(window.QuickField=new t.default(this))}})()})();