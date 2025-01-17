import React from 'react'
import { SafeAreaView, Platform } from 'react-native'
import Navigation from 'modules/navigation'
import Items from './view'
import Toolbar from '../toolbar'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as bookmarksActions from 'data/actions/bookmarks'
import * as configActions from 'data/actions/config'
import { collection } from 'data/selectors/collections'
import {
	makeBookmarksWithSections,
	makeBookmarksWithSectionsBlocked,
	makeStatusMain
} from 'data/selectors/bookmarks'

const 
	wrapStyle = {flex:1}

class SpaceContainer extends React.PureComponent {
	constructor(props) {
		super(props);

		this._navigationEvents = Navigation.events().bindComponent(this)
	}

	componentDidAppear() {
		if (!this.props.data.length)
			this.onLoad()
	}

	componentWillUnmount() {
		this._navigationEvents && this._navigationEvents.remove()
	}

	navigationButtonPressed({ buttonId }) {
		switch(buttonId){
			case 'search':
				Navigation[Platform.isPad ? 'push' : 'showModal'](this.props, 'bookmarks/search', {spaceId: this.props.spaceId+'s'})
			break

			case 'add':
				Navigation.showModal(this.props, 'bookmark/add/home', {collectionId: this.props.collection._id||-1})
			break
		}
	}

	onLoad = ()=>{
		this.props.actions.bookmarks.reload(this.props.spaceId)
	}

	onRefresh = ()=>{
		this.props.actions.bookmarks.refresh(this.props.spaceId)
	}

	onNextPage = ()=>{
		this.props.actions.bookmarks.nextPage(this.props.spaceId)
	}

	render() {
		return (
			<SafeAreaView style={wrapStyle}>
				<Items 
					spaceId={this.props.spaceId}

					collection={this.props.collection}
					data={this.props.data}
					status={this.props.status}
					componentId={this.props.componentId}
					showCollectionPath={this.props.collection._id==0}
					hideHead={this.props.hideHead}

					onRefresh={this.onRefresh}
					onNextPage={this.onNextPage} />

				<Toolbar 
					spaceId={this.props.spaceId}
					componentId={this.props.componentId} />
			</SafeAreaView>
		)
	}
}

export default connect(
	() => {
		const 
			getSections = makeBookmarksWithSections(),
			getSectionsBlocked = makeBookmarksWithSectionsBlocked(),
			getStatusMain = makeStatusMain()
	
		return (state, {spaceId})=>{
			const currentCollection = collection(state, spaceId)
			let data
	
			switch(currentCollection.view){
				case 'grid':
				case 'masonry':
					data = getSectionsBlocked(state, spaceId)
				break
	
				default:
					data = getSections(state, spaceId)
				break
			}
			
			return {
				status: 			getStatusMain(state, spaceId),
				collection: 		currentCollection,
				data: 				data
			}
		}
	},
	(dispatch)=>({
		actions: {
			bookmarks: 			bindActionCreators(bookmarksActions, dispatch),
			config: 			bindActionCreators(configActions, dispatch)
		}
	})
)(SpaceContainer)