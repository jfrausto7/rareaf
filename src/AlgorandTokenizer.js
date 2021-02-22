/* eslint-disable no-console */
'use strict'

const React = require('react')
import { Button } from "@blueprintjs/core"

class AlgorandTokenizer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            meta_hash: undefined,
            file_hash: this.props.file_hash,
            title: "unnamed",
            artist: "anon",
            description: "speaks for itself",
            tags: ["art", "is", "in", "your", "mind"],
        }
        this.handleChange = this.handleChange.bind(this)
        this.createToken = this.createToken.bind(this)
        this.componentWillReceiveProps = this.componentWillReceiveProps.bind(this)
    }

    componentWillReceiveProps({ file_hash }) {
        this.setState({ file_hash: file_hash });
    }

    async createToken(event) {
        event.stopPropagation()
        event.preventDefault()

        await uploadMetadata(this.captureMetadata())

        //TODO: select box to pick which acct to use
        let accts = await AlgoSigner.accounts({ ledger: 'TestNet' })
        const acct = accts[0]["address"]

        let txParams = await AlgoSigner.algod({ ledger: 'TestNet', path: '/v2/transactions/params' })

        let signedTx = await AlgoSigner.sign({
            from: acct,
            assetManager: acct,
            assetFreeze: acct,
            assetClawback: acct,
            assetName: "RareAF",
            assetUnitName: "RAF",
            assetTotal: 1,
            assetDecimals: 0,
            note: "RAF-MINT-" + this.state.meta_hash,
            type: 'acfg',
            fee: txParams['min-fee'],
            firstRound: txParams['last-round'],
            lastRound: txParams['last-round'] + 1000,
            genesisID: txParams['genesis-id'],
            genesisHash: txParams['genesis-hash'],
            assetURL: "rare.af/"
        });

        let tx = await AlgoSigner.send({ ledger: 'TestNet', tx: signedTx.blob })
    }

    handleChange(event) {
        const target = event.target
        const value = target.type == 'checkbox' ? target.checked : target.value
        const name = target.name
        this.setState({ [name]: value })
    }

    captureMetadata() {
        return {
            title: this.state.title,
            artist: this.state.artist,
            file_hash: this.state.file_hash,
            description: this.state.description,
            tags: this.state.tags,
            created: "Created at Rare.AF"
        }
    }

    render() {
        return (
            <div>
                <div className='container' >
                    <input className='details-basic details-title bp3-input bp3-large' onChange={this.handleChange} type='text' name='title' id='title' value={this.state.title}></input>
                    <input className='details-basic details-artist bp3-input bp3-large' onChange={this.handleChange} type='text' name='artist' id='artist' value={this.state.artist}></input>
                </div>
                <div className='container'>
                    <textarea className='details-description bp3-input bp3-large' onChange={this.handleChange} type='text' name='description' id='description' value={this.state.description}></textarea>
                </div>
                <div className='container-mint'>
                    <Button onClick={this.createToken} rightIcon='clean' large={true} intent='success'>Mint</Button>
                </div>
            </div>
        )
    }
}
module.exports = AlgorandTokenizer