(()=>{"use strict";var t={973:(t,e,i)=>{i.r(e)},304:(t,e,i)=>{Object.defineProperty(e,"__esModule",{value:!0});const s=i(311);e.default=Garnish.Modal.extend({$body:null,$content:null,$main:null,$footer:null,$leftButtons:null,$rightButtons:null,$deleteBtn:null,$saveBtn:null,$saveCopyBtn:null,$cancelBtn:null,$saveSpinner:null,$deleteSpinner:null,$loadSpinner:null,$html:null,$js:null,$css:null,$currentHtml:null,$currentJs:null,$currentCss:null,$observed:null,observer:null,executedJs:null,loadedCss:null,templateLoaded:!1,_layoutTypes:null,init:function(t){this.base(),this.setSettings(t,{resizable:!0}),this.$currentHtml=s(),this.$currentJs=s(),this.$currentCss=s(),this.$observed=s(),this.executedJs={},this.loadedCss={},this._layoutTypes={},this.observer=new window.MutationObserver((t=>{for(let e=0;e<t.length;e++)this.$observed=this.$observed.add(t[e].addedNodes)}));const e=s('<form class="modal quick-field-modal" style="display: none; opacity: 0;">').appendTo(Garnish.$bod);this.$body=s('<div class="body">').appendTo(e),this.$content=s('<div class="content">').appendTo(this.$body),this.$main=s('<div class="main">').appendTo(this.$content),this.$footer=s('<div class="footer">').appendTo(e),this.$loadSpinner=s('<div class="spinner big">').appendTo(e),this.$leftButtons=s('<div class="buttons left">').appendTo(this.$footer),this.$rightButtons=s('<div class="buttons right">').appendTo(this.$footer),this.$deleteBtn=s('<a class="delete error hidden">').text(Craft.t("quick-field","Delete")).appendTo(this.$leftButtons),this.$deleteSpinner=s('<div class="spinner hidden">').appendTo(this.$leftButtons),this.$cancelBtn=s('<div class="btn disabled" role="button">').text(Craft.t("quick-field","Cancel")).appendTo(this.$rightButtons),this.$saveBtn=s('<div class="btn submit disabled" role="button">').text(Craft.t("quick-field","Save")).appendTo(this.$rightButtons),this.$saveCopyBtn=s('<div class="btn submit disabled hidden" role="button">').text(Craft.t("quick-field","Save as a new field")).appendTo(this.$rightButtons),this.$saveSpinner=s('<div class="spinner hidden">').appendTo(this.$rightButtons),this.setContainer(e)},initTemplate:function(t){if(this.templateLoaded)return;const e=t=>{this.$html=t.$html,this.$js=t.$js,this.$css=t.$css,this.templateLoaded=!0,this.initListeners(),this.visible&&this.initSettings(),this.off("parseTemplate",e)};this.on("parseTemplate",e),this.parseTemplate(t)},parseTemplate:function(t){const e=Garnish.$doc.find("head"),i=s(t.html),n=s(t.js).filter("script"),a=s(t.css).filter("style, link"),d=a.filter("link").prop("async",!0),o=a.filter("style");d.each(((t,i)=>{const n=s(i),a=n.prop("href");void 0===this.loadedCss[a]&&(e.append(n),this.loadedCss[a]=n)}));const l=n.filter("[src]"),r=n.filter(":not([src])"),u=[];l.each(((t,e)=>{const i=s(e).prop("src");void 0===this.executedJs[i]&&(u.push(i),this.executedJs[i]=!0)}));const h=()=>{this.off("runExternalScripts",h),this.trigger("parseTemplate",{target:this,$html:i,$js:r,$css:o})};this.on("runExternalScripts",h),this.runExternalScripts(u)},runExternalScripts:function(t){let e=t.length;if(e>0)for(let i=0;i<t.length;i++){const n=t[i];s.getScript(n).done(((t,i)=>{"success"===i?(e--,0===e&&this.trigger("runExternalScripts",{target:this})):Craft.cp.displayError(Craft.t("quick-field","Could not load all resources."))})).catch((()=>Craft.cp.displayError(Craft.t("quick-field","Could not load all resources."))))}else this.trigger("runExternalScripts",{target:this})},initListeners:function(){this.$cancelBtn.removeClass("disabled"),this.$saveBtn.removeClass("disabled"),this.$saveCopyBtn.removeClass("disabled"),this.addListener(this.$cancelBtn,"activate","closeModal"),this.addListener(this.$saveBtn,"activate","saveField"),this.addListener(this.$saveCopyBtn,"activate","saveField"),this.addListener(this.$deleteBtn,"activate","deleteField"),this.on("show",this.initSettings),this.on("fadeOut",this.destroySettings),this.enable()},destroyListeners:function(){this.$cancelBtn.addClass("disabled"),this.$saveBtn.addClass("disabled"),this.$saveCopyBtn.addClass("disabled"),this.removeListener(this.$cancelBtn,"activate"),this.removeListener(this.$saveBtn,"activate"),this.removeListener(this.$saveCopyBtn,"activate"),this.removeListener(this.$deleteBtn,"activate"),this.off("show",this.initSettings),this.off("fadeOut",this.destroySettings),this.disable()},initSettings:function(t){var e,i,n,a;const d=null!==(e=null==t?void 0:t.target)&&void 0!==e?e:this;if(!d.templateLoaded)return;d.$currentHtml=null!==(i=null==t?void 0:t.$html)&&void 0!==i?i:d.$html.clone(),d.$currentJs=null!==(n=null==t?void 0:t.$js)&&void 0!==n?n:d.$js.clone(),d.$currentCss=null!==(a=null==t?void 0:t.$css)&&void 0!==a?a:d.$css.clone(),d.$observed=s(),d.observer.observe(Garnish.$bod[0],{childList:!0,subtree:!1}),d.$main.append(d.$currentHtml),Garnish.$bod.append(d.$currentJs);const o=d.$main.find('input[name="qf[fieldId]"]');d.$deleteBtn.toggleClass("hidden",0===o.length),Craft.initUiElements();const l=()=>{d.off("runExternalScripts",l),setTimeout((()=>d.observer.disconnect()),1)};d.on("runExternalScripts",l),d.runExternalScripts(Object.keys(d.executedJs))},destroySettings:function(t){var e;const i=null!==(e=null==t?void 0:t.target)&&void 0!==e?e:this;i.$currentHtml.remove(),i.$currentJs.remove(),i.$currentCss.remove(),i.$observed.remove(),i.$deleteBtn.addClass("hidden")},closeModal:function(){this.hide()},editField:function(t){this.destroyListeners(),this.show(),this.initListeners(),this.$loadSpinner.removeClass("hidden");const e={fieldId:t};Craft.sendActionRequest("POST","quick-field/actions/edit-field",{data:e}).then((t=>{const e=t=>{this.destroySettings(),this.initSettings(t),this.$saveCopyBtn.removeClass("hidden"),this.off("parseTemplate",e)};this.on("parseTemplate",e),this.parseTemplate(t.data.template)})).catch((t=>{var e;Craft.cp.displayError(null!==(e=t.error)&&void 0!==e?e:Craft.cp.displayError(Craft.t("quick-field","An unknown error occurred."))),this.hide()})).finally((()=>this.$loadSpinner.addClass("hidden")))},saveField:function(t){if(null==t||t.preventDefault(),this.$saveBtn.hasClass("disabled")||!this.$saveSpinner.hasClass("hidden"))return;this.destroyListeners(),this.$saveSpinner.removeClass("hidden");const e=this.$saveCopyBtn.is(null==t?void 0:t.target),i=this.$container.find('input[name="qf[fieldId]"]');e&&i.val("");const s=this.$container.serialize(),n=!e&&i.length>0?i.val():null;Craft.sendActionRequest("POST","quick-field/actions/save-field",{data:s}).then((t=>{this.initListeners();const e={target:this,field:t.data.field,elementSelectors:t.data.elementSelectors,selectorHtml:t.data.selectorHtml};null===n?(this.trigger("newField",e),Craft.cp.displayNotice(Craft.t("quick-field","New field created."))):(this.trigger("saveField",e),Craft.cp.displayNotice(Craft.t("quick-field","'{name}' field saved.",{name:t.data.field.name}))),this.hide()})).catch((({response:t})=>{var e,i;if(null!==(null!==(i=null===(e=t.data)||void 0===e?void 0:e.template)&&void 0!==i?i:null))if(this.visible){const e=t=>{this.initListeners(),this.destroySettings(),this.initSettings(t),this.off("parseTemplate",e)};this.on("parseTemplate",e),this.parseTemplate(t.data.template),Garnish.shake(this.$container)}else this.initListeners();else this.initListeners(),Craft.cp.displayError(Craft.t("quick-field","An unknown error occurred."))})).finally((()=>this.$saveSpinner.addClass("hidden")))},deleteField:function(t){if(null==t||t.preventDefault(),!this.$deleteBtn.hasClass("disabled")&&this.$deleteSpinner.hasClass("hidden")&&this.promptForDelete()){this.destroyListeners(),this.$deleteSpinner.removeClass("hidden");const t=this.$container.find('input[name="qf[fieldId]"]'),e=t.length>0?t.val():null;if(null===e)return void Craft.cp.displayError(Craft.t("quick-field","An unknown error occurred."));const i={fieldId:e};Craft.sendActionRequest("POST","quick-field/actions/delete-field",{data:i}).then((t=>{this.initListeners(),this.trigger("deleteField",{target:this,field:t.data.field}),Craft.cp.displayNotice(Craft.t("quick-field","'{name}' field deleted.",{name:t.data.field.name})),this.hide()})).catch((t=>{var e;Craft.cp.displayError(null!==(e=t.error)&&void 0!==e?e:Craft.cp.displayError(Craft.t("quick-field","An unknown error occurred."))),this.hide()})).finally((()=>this.$deleteSpinner.addClass("hidden")))}},promptForDelete:function(){return confirm(Craft.t("quick-field","Are you sure you want to delete this field?"))},addLayoutType:function(t){void 0===this._layoutTypes[t]||0===this._layoutTypes[t]?(this._layoutTypes[t]=1,s(`<input type="hidden" name="qf[layoutTypes][]" value="${t}">`).prependTo(this.$container)):this._layoutTypes[t]++},removeLayoutType:function(t){void 0!==this._layoutTypes[t]&&this._layoutTypes[t]>0&&(this._layoutTypes[t]--,0===this._layoutTypes[t]&&this.$container.find(`input[name="qf[layoutTypes][]"][value="${t}"]`).remove())},hide:function(){this._disabled||(this.base(),setTimeout((()=>this.$saveCopyBtn.addClass("hidden")),200))},destroy:function(){this.base(),this.destroyListeners(),this.destroySettings(),this.$shade.remove(),this.$container.remove(),this.trigger("destroy")}})},363:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.GroupDialog=void 0;const i=Garnish.Base.extend({addNewGroup:function(){this._saveGroup(null,"",this._triggerGroupUpdateEvent("newGroup"))},renameGroup:function(t,e){this._saveGroup(t,e,this._triggerGroupUpdateEvent("renameGroup"))},_saveGroup:function(t,e,i){const s=this.promptForGroupName(e);if(""!==s){const n={name:s,id:t};Craft.sendActionRequest("POST","fields/save-group",{data:n}).then((t=>i(this,t.data.group,e))).catch((({response:t})=>{var e,i;if(Object.keys(null!==(i=null===(e=t.data)||void 0===e?void 0:e.errors)&&void 0!==i?i:{}).length>0){const e=this._flattenErrors(t.data.errors);alert(`${Craft.t("quick-field","Could not save the group:")}\n\n${e.join("\n")}`)}else Craft.cp.displayError(Craft.t("quick-field","An unknown error occurred."))}))}},_triggerGroupUpdateEvent:function(t){return(e,i,s)=>{e.trigger(t,{target:e,group:i,oldName:s})}},deleteGroup:function(t){if(confirm(Craft.t("quick-field","Are you sure you want to delete this group and all its fields?"))){const e={id:t.id};Craft.sendActionRequest("POST","fields/delete-group",{data:e}).then((e=>this.trigger("deleteGroup",{group:t}))).catch((t=>Craft.cp.displayError(Craft.t("quick-field","Could not delete the group."))))}},promptForGroupName:function(t){return prompt(Craft.t("quick-field","What do you want to name the group?"),t)},_flattenErrors:function(t){return Object.keys(t).reduce(((e,i)=>e.concat(t[i])),[])}});e.GroupDialog=i},451:(t,e)=>{var i;Object.defineProperty(e,"__esModule",{value:!0}),e.Loader=void 0,function(t){t[t.UNLOADED=0]="UNLOADED",t[t.LOADING=1]="LOADING",t[t.LOADED=2]="LOADED"}(i||(i={}));const s=Garnish.Base.extend({loadStatus:null,init:function(){this.loadStatus=i.UNLOADED,this.load()},load:function(){this.loadStatus===i.UNLOADED&&(this.loadStatus=i.LOADING,Craft.sendActionRequest("POST","quick-field/actions/load",{}).then((t=>{this.loadStatus=i.LOADED,this.trigger("load",{template:t.data.template,groups:t.data.groups})})).catch((t=>{this.loadStatus=i.UNLOADED,this.trigger("unload")})))},isUnloaded:function(){return this.loadStatus===i.UNLOADED}});e.Loader=s},182:(t,e,i)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.QuickField=void 0;const s=i(311),n=i(304),a=i(363),d=i(451);class o{constructor(t,e,i){this.component=e,this.data=i,this._action=t}get action(){return this._action}}class l extends o{constructor(t,e,i){super(t,e,i),this.component=e,this.data=i}}class r extends o{constructor(t,e,i){super(t,e,i),this.component=e,this.data=i}}var u;!function(t){t[t.ADD=0]="ADD",t[t.EDIT=1]="EDIT",t[t.REMOVE=2]="REMOVE"}(u||(u={}));class h{constructor(t,e){this._quickField=t,this.fld=e,this.fld.$container.addClass("quick-field"),this.$container=s('<div class="newfieldbtn-container btngroup small fullwidth">').prependTo(e.$fieldLibrary),this.$groupButton=s('<div class="btn small add icon" tabindex="0">').text(Craft.t("quick-field","New Group")).appendTo(this.$container),this.$fieldButton=s('<div class="btn small add icon" tabindex="0">').text(Craft.t("quick-field","New Field")).appendTo(this.$container),this._replacePlaceholder={},this._groupObserver=new window.MutationObserver((()=>{this.fld.$fieldGroups.filter((function(){var t;return null!==(t=s(this).data("id"))&&void 0!==t&&t})).removeClass("hidden")})),this._groupObserver.observe(this.fld.$fieldLibrary[0],{attributes:!0,childList:!0,subtree:!0})}getType(){return this._type}setType(t){this._type=t}attachFieldButton(){this.$fieldButton.appendTo(this.$container)}detachFieldButton(){this.$fieldButton.detach()}addFieldEditButtons(){const t=(t,e)=>this._quickField.addFieldEditButton(s(e));this.fld.$fields.filter(".unused").each(t),this.fld.$tabContainer.find(".fld-field[data-id]").each(t)}addGroupMenus(){this.fld.$fieldGroups.each(((t,e)=>this._addGroupMenu(s(e))))}_addGroupMenu(t){const e=s(`<button class="qf-settings icon menubtn" title="${Craft.t("quick-field","Settings")}" role="button" type="button"></button>`),i=s(`\n      <div class="menu">\n        <ul class="padded">\n          <li><a data-icon="edit" data-action="rename">${Craft.t("quick-field","Rename")}</a></li>\n          <li><a class="error" data-icon="remove" data-action="delete">${Craft.t("quick-field","Delete")}</a></li>\n        </ul>\n      </div>\n    `);t.prepend(i).prepend(e),new Garnish.MenuBtn(e).on("optionSelect",(e=>{switch(s(e.option).attr("data-action")){case"rename":this._quickField.openRenameGroupDialog(t);break;case"delete":this._quickField.openDeleteGroupDialog(t)}}))}addGroupIdData(t){for(let e=t.length-1;e>=0;e--){const i=t[e];let s=this._getGroupByName(i.name);0===s.length&&(this.addGroup(i,!1),s=this._getGroupByName(i.name)),s.data("id",i.id)}this._resetFldGroups()}addField(t,e){if(this.fld.$fields.filter(`.fld-field[data-id="${t.id}"]`).length>0)return;const i=this._getGroupByName(t.group.name);if(null===i)throw new Error("Invalid field group: {groupName}");this._insertFieldElementIntoGroup(t,e,i)}removeField(t){const e=`.fld-field[data-id="${t}"]`,i=this.fld,s=i.$fields,n=s.filter(e).add(i.$tabContainer.find(e));n.length>0&&(n.remove(),i.$fields=s.not(n),i.elementDrag.removeItems(n))}resetField(t,e,i){const s=this.fld,n=this._getGroupByName(t.group.name),a=s.$fields.filter(`[data-id="${t.id}"]`);s.elementDrag.removeItems(a),a.remove(),this._insertFieldElementIntoGroup(t,e,n),this._updateFldField(t,i)}_updateFldField(t,e){const i=this.fld.$tabContainer.find(`.fld-field[data-id="${t.id}"]`);if(0===i.length)return;const n=i.find(".fld-required-indicator").detach(),a=i.data("fld-element");a.$editBtn.detach(),void 0!==this._replacePlaceholder[t.id]&&a.off("createSettings.qf",this._replacePlaceholder[t.id]),this._replacePlaceholder[t.id]=function(){var e;null===(e=this.slideout)||void 0===e||e.$container.find('input[name$="[label]"').attr("placeholder",t.name)}.bind(a),a.on("createSettings.qf",this._replacePlaceholder[t.id]),this._replacePlaceholder[t.id](),i.data("attribute",t.handle).html(s(e).html()),n.appendTo(i.find(".fld-element-label")),a.initUi()}addGroup(t,e){if(this._getGroupByName(t.name).length>0)return;const i=t.name,n=i.toLowerCase(),a=s(`\n      <div class="fld-field-group" data-name="${n}">\n        <h6>${i}</h6>\n      </div>`);this._addGroupMenu(a),this._attachGroup(a,e),this._getGroupByName(t.name).data("id",t.id)}renameGroup(t,e){const i=this._getGroupByName(e);if(i.length>0){const e=t.name,s=e.toLowerCase();i.detach().attr("data-name",s).data("name",s).children("h6").text(e),this._attachGroup(i,!0)}}removeGroup(t){const e=this.fld,i=e.$fieldGroups.filter((function(){return s(this).data("id")===t})),n=i.find(".fld-field.hidden").map(((t,e)=>`[data-id="${s(e).data("id")}"]`)).get().join(",");e.$tabContainer.find(".fld-field").filter(n).remove(),i.remove(),this._resetFldGroups()}_insertFieldElementIntoGroup(t,e,i){const n=this.fld,a=s(e),d=t.name.toLowerCase();let o=i.children(".fld-element").filter((function(){return s(this).find("h4").text().toLowerCase()<d})).last();0===o.length&&(o=i.children("h6")),a.insertAfter(o),n.elementDrag.addItems(a),this._quickField.addFieldEditButton(a),n.$fields=n.$fieldGroups.children(".fld-element")}_attachGroup(t,e){var i;const n=this.fld,a=null!==(i=t.attr("data-name"))&&void 0!==i?i:"";let d=n.$fieldGroups.filter((function(){const t=s(this);return t.hasClass("hidden")||t.data("name")<a})).last();0===d.length&&(d=n.$fieldSearch.parent()),t.insertAfter(d),e&&this._resetFldGroups()}_resetFldGroups(){this.fld.$fieldGroups=this.fld.$sidebar.find(".fld-field-group")}_getGroupByName(t){return this.fld.$sidebar.find(".fld-field-group").filter(`[data-name="${t.toLowerCase()}"]`)}}const c=Garnish.Base.extend({dialog:null,modal:null,loader:null,_layouts:null,_history:null,_initialGroups:null,init:function(){let t=!0;this._layouts=[],this._history=[],this.dialog=new a.GroupDialog,this.modal=new n.default,this.loader=new d.Loader,this.dialog.on("newGroup",(e=>{const i=e.group;this._addGroup(i,!0),this.loader.isUnloaded()?this.loader.load():t||(this._layouts.forEach((t=>t.attachFieldButton())),t=!0)})),this.dialog.on("renameGroup",(t=>this._renameGroup(t.group,t.oldName))),this.dialog.on("deleteGroup",(e=>{this._removeGroup(e.group),this._layouts.forEach((e=>{0===e.fld.$fieldGroups.not(".hidden").length&&(e.detachFieldButton(),t=!1)}))})),this.modal.on("newField",(t=>this._addField(t.field,t.elementSelectors))),this.modal.on("saveField",(t=>this._resetField(t.field,t.elementSelectors,t.selectorHtml))),this.modal.on("deleteField",(t=>this._removeField(t.field))),this.modal.on("destroy",(()=>{this._layouts.forEach((t=>t.detachFieldButton())),t=!1})),this.loader.on("load",(e=>{this.modal.$loadSpinner.addClass("hidden"),this.modal.initTemplate(e.template),this._layouts.forEach((t=>t.addGroupIdData(e.groups))),this._initialGroups=e.groups,t||(this._layouts.forEach((t=>t.$fieldButton.appendTo(t.$container))),t=!0)})),this.loader.on("unload",(()=>this.modal.destroy()))},addFld:function(t){const e=new h(this,t);this._layouts.push(e),this.addListener(e.$groupButton,"activate","_newGroup"),this.addListener(e.$fieldButton,"activate","_newField"),e.addFieldEditButtons(),e.addGroupMenus(),e.addGroupIdData(this._initialGroups);const i=t.$uiLibraryElements.filter('[data-type="craft-fieldlayoutelements-Heading"]').data("settings-html").match(/elementType&quot;:&quot;([a-zA-Z\\]+)&quot;,&quot;sourceKey/g),s=i[i.length-1].split("&quot;")[2].replaceAll("\\\\","\\");this.modal.addLayoutType(s),e.setType(s),this._history.forEach((t=>{var i,n,a,d,o,h,c,p;if(t instanceof l)switch(t.action){case u.ADD:e.addField(t.component,null!==(n=null===(i=t.data)||void 0===i?void 0:i.elementSelectors[s])&&void 0!==n?n:"");break;case u.EDIT:e.resetField(t.component,null!==(d=null===(a=t.data)||void 0===a?void 0:a.elementSelectors[s])&&void 0!==d?d:"",null!==(h=null===(o=t.data)||void 0===o?void 0:o.selectorHtml)&&void 0!==h?h:"");break;case u.REMOVE:e.removeField(t.component.id)}else if(t instanceof r)switch(t.action){case u.ADD:e.addGroup(t.component,!0);break;case u.EDIT:e.renameGroup(t.component,null!==(p=null===(c=t.data)||void 0===c?void 0:c.oldName)&&void 0!==p?p:"");break;case u.REMOVE:e.removeGroup(t.component.id)}}))},addFieldEditButton:function(t){const e=s('<a class="qf-edit icon" title="Edit"></a>');this.addFieldEditButtonListener(e),t.append(e)},addFieldEditButtonListener:function(t){this.addListener(t,"activate","_editField")},_newField:function(){this.modal.show()},_editField:function(t){const e=s(t.target).parent().data("id");this.modal.editField(e)},_addField:function(t,e){try{this._layouts.forEach((i=>{const s=i.getType();i.addField(t,e[s])})),this._history.push(new l(u.ADD,t,{elementSelectors:e}))}catch(e){Craft.cp.displayError(Craft.t("quick-field",e.message,{groupName:t.group.name}))}},_removeField:function(t){this._layouts.forEach((e=>e.removeField(t.id))),this._history.push(new l(u.REMOVE,t))},_resetField:function(t,e,i){this._layouts.forEach((s=>{const n=s.getType();s.resetField(t,e[n],i)})),this._history.push(new l(u.EDIT,t,{elementSelectors:e,selectorHtml:i}))},_newGroup:function(){this.dialog.addNewGroup()},_addGroup:function(t,e){this._layouts.forEach((i=>i.addGroup(t,e))),this._history.push(new r(u.ADD,t)),null!==this.modal.$html&&this._addOptionToGroupSelect(s(`<option value="${t.id}">${t.name}</option>`),this.modal.$html.find("#qf-group"),t.name)},openRenameGroupDialog:function(t){const e=t.data("id"),i=t.children("h6").text();this.dialog.renameGroup(e,i)},_renameGroup:function(t,e){this._layouts.forEach((i=>i.renameGroup(t,e))),this._history.push(new r(u.EDIT,t,{oldName:e}));const i=this.modal.$html.find("#qf-group"),n=i.children().filter((function(){return s(this).text()===e})).detach().text(t.name);this._addOptionToGroupSelect(n,i,t.name)},_addOptionToGroupSelect:function(t,e,i){const n=e.children().filter((function(){return s(this).text().toLowerCase()<i.toLowerCase()})).last();n.length>0?t.insertAfter(n):t.prependTo(e)},openDeleteGroupDialog:function(t){const e={id:t.data("id"),name:t.children("h6").text()};this.dialog.deleteGroup(e)},_removeGroup:function(t){this._layouts.forEach((e=>e.removeGroup(t.id))),this._history.push(new r(u.REMOVE,t)),this.modal.$html.find("#qf-group").children(`[value="${t.id}"]`).remove()}});e.QuickField=c},311:t=>{t.exports=jQuery}},e={};function i(s){var n=e[s];if(void 0!==n)return n.exports;var a=e[s]={exports:{}};return t[s](a,a.exports,i),a.exports}i.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},(()=>{const t=i(182);i(973),window.QuickField=new t.QuickField;const e=Craft.FieldLayoutDesigner,s=e.prototype.init,n=e.Element,a=n.prototype.initUi;e.prototype.init=function(){s.apply(this,arguments),this.$container.is(".layoutdesigner")&&window.QuickField.addFld(this)},n.prototype.initUi=function(){if(a.apply(this,arguments),this.$container.is(".fld-field")){const t=this.$container.find(".qf-edit");t.length>0?window.QuickField.addFieldEditButtonListener(t):window.QuickField.addFieldEditButton(this.$container)}}})()})();
//# sourceMappingURL=main.js.map