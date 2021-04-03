#!/bin/bash

source ./vars.sh

SIGNED_DELEGATE=platform-delegate.signed

ASA_SEND=asa_send.txn
ASA_CFG=asa_cfg.txn
FUND_ACCT=fund_acct.txn
PLATFORM_SEND=platform_send.txn
COMBINED=fund.txn

echo "Signing delegate sig"
./sandbox goal clerk compile $DELEGATE_NAME -a $PLATFORM_ACCT -s -o $SIGNED_DELEGATE 

echo "Creating Txns"
./sandbox goal asset send -a 1 --assetid $NFT_ID -f $CREATOR_ACCT -t $CONTRACT_ACCT -o $ASA_SEND 
./sandbox goal asset config --assetid $NFT_ID --manager $CREATOR_ACCT --new-manager $CONTRACT_ACCT -o $ASA_CFG 
./sandbox goal clerk send -a 1000000000 -f $CREATOR_ACCT -t $CONTRACT_ACCT -o $FUND_ACCT 
./sandbox goal asset send -a 1 --assetid $PLATFORM_ID -f $PLATFORM_ACCT -t $CONTRACT_ACCT -o $PLATFORM_SEND 

echo "Combining Txns"
./sandbox exec "cat $ASA_SEND $ASA_CFG $FUND_ACCT $PLATFORM_SEND > $COMBINED"

echo "Grouping/Splitting Txns"
./sandbox goal clerk group -i $COMBINED  -o $COMBINED
./sandbox goal clerk split -i $COMBINED  -o split

echo "Signing individual Txns"
./sandbox goal clerk sign -i split-0 -o $ASA_SEND
./sandbox goal clerk sign -i split-1 -o $ASA_CFG
./sandbox goal clerk sign -i split-2 -o $FUND_ACCT

echo "Signing tx with delegate sig"
b64_price=`python3 -c "import base64;print(base64.b64encode(($LISTING_PRICE).to_bytes(8,'big')).decode('ascii'))"`
b64_nft_id=`python3 -c "import base64;print(base64.b64encode(($NFT_ID).to_bytes(8,'big')).decode('ascii'))"`
./sandbox goal clerk sign -i split-3 -o $PLATFORM_SEND -L$SIGNED_DELEGATE --argb64 $b64_price  --argb64 $b64_nft_id --argb64 `cat $CONTRACT_NAME.tok | base64 -w0`

echo "Recombining Txns"
./sandbox exec "cat $ASA_SEND $ASA_CFG $FUND_ACCT $PLATFORM_SEND > $COMBINED"

echo "Sned it"
./sandbox goal clerk rawsend -f $COMBINED
