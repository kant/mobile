import Immutable from 'seamless-immutable'
import { createSelector } from 'reselect'
import _ from 'lodash-es'
import {
	getCollection,
	getGroup,
	getPath,
	normalizeCollection,
	blankDraft,
	blankCollection
} from '../helpers/collections'

//Defaults
const
	emptyObject = {},
	emptyArray = Immutable([]),
	_collectionsItems = ({collections={}})=>collections.items,
	_collectionsGroups = ({collections={}})=>collections.groups,
	_collectionsStatus = ({collections={}})=>collections.status,
	_collectionColor = ({collections={}}, collectionId)=>collections.colors[parseInt(collectionId)],
	_getCollectionById = ({collections={}}, collectionId)=>collections.items[parseInt(collectionId)]

//Tree
const getChildrens = (items, item, level=0)=>{
	var childrens = []
	childrens.push({_id: item._id, sort: item.sort, _parentId: item.parentId, level})

	if ((item._id>0)&&(item.expanded))
	_.forEach(items, (i)=>{
		if (i.parentId==item._id)
			childrens = childrens.concat(getChildrens(items, i, level+1))
	})

	return childrens
}

const makeGroupTree = (groupIds, items=[])=>{
	const sortedItems = _.sortBy(items, ({sort})=>sort)
	var results = []

	groupIds.forEach((_id)=>{
		const item = items[_id]
		if (item && !item.parentId)
			results = results.concat(getChildrens(sortedItems, item))
	})

	//Find expandable items
	var parentIds = {}
	sortedItems.forEach(({parentId})=>{
		if (parentId) parentIds[parentId]=true
	})

	for(var i in results)
		if (results[i]._id>0)
			results[i].expandable = (parentIds[results[i]._id] ? true : false)
	
	return results
}

export const makeTree = ()=> createSelector(
	[_collectionsItems, _collectionsGroups, (state,props={})=>props.options||emptyObject],
	(items, groups, options)=>{
		if (_.isEmpty(items) && _.isEmpty(groups))
			return emptyArray

		//Options
		const {
			hideIds=[],
			showGroups
		} = options
		const search = (options.search||'').trim().toLowerCase()

		const filterIds = (_id)=>(
			hideIds.indexOf(typeof _id == 'object' ? _id._id : _id)==-1
		)

		var sections = []
		
		if (!search) {
			sections = [{
				_id: 'g-1',
				title: 'default',
				data: makeGroupTree([0, -1].filter(filterIds), items),
				system: true
			}]
	
			groups.forEach((group)=>{
				var hidden = group.hidden
				if (showGroups)
					hidden = false
	
				sections.push({
					_id: group._id,
					title: group.title,
					data: hidden ? [] : makeGroupTree(group.collections, items).filter(filterIds),
					hidden: hidden,
					sort: group.sort
				})
			})
	
			sections.push({
				_id: 'g-2',
				title: 'default',
				data: makeGroupTree([-99].filter(filterIds), items),
				system: true
			})
		}else{
			const filtered = _.filter(items, ({title})=>title.toLowerCase().includes(search))
			sections = [{
				_id: 'g-999',
				title: 'default',
				data: _.sortBy(filtered, ({title})=>title),
				system: true
			}]
		}

		return Immutable(sections)
	}
)

export const makeTreeFlat = ()=> createSelector(
	[makeTree(), ({collections})=>collections.blankChildInParent],
	(groups, blankChildInParent)=>{
		const flat = []
		groups.forEach((g)=>{
			if (!g.system)
				flat.push({...g, type: 'group', data: undefined})

			//use this index for append 'add new'
			let _blankIndex = -1

			//items
			g.data.forEach((c)=>{
				flat.push({...c, type: 'collection'})

				if (blankChildInParent && blankChildInParent==c._id)
					flat[flat.length-1].expandable=true

				if (blankChildInParent && (blankChildInParent==c._parentId || blankChildInParent==c._id))
					_blankIndex = flat.length
			})

			//add new as child
			if (_blankIndex!=-1){
				const parent = _.find(g.data, ({_id})=>_id==blankChildInParent)
				flat.splice(_blankIndex, 0, {parentId: parent._id, level: parent.level+1, type: 'blankCollection', _id: 'blank_'+parent._id})
			}
			//add new as root
			if (!g.system && !g.hidden)
				flat.push({parentId: g._id, type: 'blankCollection', _id: 'blank_'+g._id})
		})
		return flat
	}
)

//Status
export const makeCollectionsStatus = ()=> createSelector(
	[_collectionsStatus],
	(status)=>status
)

//Single, super fast
export const collection = (state, _id) => state.collections.items[_id] ? state.collections.items[_id] : blankCollection

//More safe, slower
export const makeCollection = ()=> createSelector(
	[_getCollectionById, (state,_id)=>_id, _collectionColor ],
	getCollection
)

//Group
export const group = createSelector(
	[_collectionsGroups, (state,_id)=>_id],
	getGroup
)

//Path
export const makeCollectionPath = ()=>createSelector(
	[_collectionsItems, _collectionsGroups, (state, objectId)=>objectId, (state,collectionId,options)=>options],
	getPath
)

//Draft
export const makeDraftItem = ()=>createSelector(
	[({collections={}}, _id)=>{
		if (!collections.getIn(['drafts', _id, 'item']))
			return normalizeCollection({_id: _id})

		return collections.drafts[_id].item
	}],
	(item)=>item
)

//Draft Status
export const makeDraftStatus = ()=>createSelector(
	[({collections={}}, _id)=>{
		if (!collections.getIn(['drafts', _id, 'status']))
			return blankDraft.status

		return collections.drafts[_id].status
	}],
	(status)=>status
)