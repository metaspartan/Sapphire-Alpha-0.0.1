pragma solidity ^0.4.11;

// Verson Alpha 1.0.0
//
//  03-July-2018 0000
// 
//  Name: EGEM Side Chain Token 
//
//  Description: 
//      EGEM Side Chain Token contract, using 
//      the ERC20 Token standrd functions to be
//      exchange and wallet compatible.
//
//      
// 
//  Author: Catsper    (discord @Catsper)
//  License: cc-by-sa-4.0
//  
//



library SafeMath {
    function mul(uint256 a, uint256 b) internal constant returns (uint256) {
        uint256 c = a * b;
        assert(a == 0 || c / a == b);
        return c;
    }

    function div(uint256 a, uint256 b) internal constant returns (uint256) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return c;
    }

    function sub(uint256 a, uint256 b) internal constant returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function add(uint256 a, uint256 b) internal constant returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}


contract Ownable {
    address public owner;

    function Ownable() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) onlyOwner {
        require(newOwner != address(0));
        owner = newOwner;
    }

}




/*
    ERC20Basic
    Simpler version of ERC20 interface
    https://github.com/ethereum/EIPs/issues/179
 */
contract ERC20Basic {
    uint256 public totalSupply;
    function balanceOf(address who) constant returns (uint256);
    function transfer(address to, uint256 value) returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
}


/*
    ERC20 interface
    https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 is ERC20Basic {
    function allowance(address owner, address spender) constant returns (uint256);
    function transferFrom(address from, address to, uint256 value) returns (bool);       
    function approve(address spender, uint256 value) returns (bool);
    
    event Approval(address indexed owner, address indexed spender, uint256 value);
}



contract TokenStandard {
    
    function getInfo(address) public view returns (uint256, uint256);
    function TokenHolderExist(address) public view returns (bool);
    function addHolder(address) internal returns (uint256);
    function HowmanyHolders();
    function ownerBurnToken(uint _value);
    function ownerCreateToken(uint _value);
    function ownerIncreaseTokenMax(uint _value);
    function EGEM_To_Token(address _toAddress) payable;
    
    event Setupcontract_event(address _sender, bool _set); 
    event Contractstatus_event(address _sender, bool _status);
    event Burn(address indexed burner, uint256 value);  
    event Create(address indexed burner, uint256 value);  
    event IncreaseMax(address indexed burner, uint256 value);
}


contract EGEM_SideChainToken is ERC20, TokenStandard, Ownable {
    
    
    using SafeMath for uint256;

    string public name = "ChainToken";
    string public symbol = "ECT";
    uint256 public decimals = 8;
    uint256 public ratio;
    uint256 public chainStartTime;                                              //chain start time
    uint256 public chainStartBlockNumber;                                       //chain start block number

    uint256 public totalSupply;
    uint256 public maxTotalSupply;
    uint256 public totalInitialSupply;
    uint256 public amountdiv;  
    uint256 allowance_a; 

  
    address tempaddr;  
    uint public numofHolders;

    uint256 ADD_TokenBalance;      
    
    
    
    struct HolderInfo{
        uint256 HolderId;
        address HolderAddress;
        uint256 TokenBalance;       // in tokens (2 decimal places)/
    }
    
        
        
    mapping (address => mapping (address => uint256)) public allowed;

    mapping(address => HolderInfo) public Info;       
    address[] Holders;     
    



    /**
     * @dev Fix for the ERC20 short address attack.
     */
    modifier onlyPayloadSize(uint size) {
        require(msg.data.length >= size + 4);
        _;
    }

 



    function EGEM_SideChainToken() {

        //totalInitialSupply = 0; // 
        //maxTotalSupply = 0; // 
        totalInitialSupply = 10**11; // 1k
        maxTotalSupply = totalInitialSupply.mul(2); // 2k
        
        ratio = 10**10;        //E10 --> 11-8 = 3 zeros of supply.decimals

        chainStartTime = now;
        chainStartBlockNumber = block.number;

        // ------------------------------------------------------------------------
        // first thing todo is make Owner account 0 and assign owner all the 
        //  tokens (if any at this point). Set a few status flags.
        //  
        //   
        // ------------------------------------------------------------------------
        addHolder(msg.sender);                                                  //adds contracts deployer (current owner) to the list of Holders as account zero
        Info[msg.sender].TokenBalance = totalInitialSupply;
        totalSupply = totalInitialSupply;
        numofHolders = 1;                                                       //set number of Holders to 1 on deployment, this is the owner.
    }





    //############################################################################################################################################################
    //
    //  ERC20 Standard functions
    //


    function totalSupply() public constant returns (uint){
        return totalSupply;
    }
    
    function transfer(address _to, uint256 _value) onlyPayloadSize(2 * 32) returns (bool) {
        
        addHolder(_to);                                                       //test if Staker exists and if not add to Holders list with clean slate.
        Info[msg.sender].TokenBalance = (Info[msg.sender].TokenBalance).sub(_value);
        Info[_to].TokenBalance = (Info[_to].TokenBalance).add(_value);
        Transfer(msg.sender, _to, _value);                                      //publish event.

        return true;
    }


     function transferFrom(address _from, address _to, uint256 _value)  returns (bool)  {

        allowance_a = allowed[_from][_to];                                      //token _to address must already have approved some value of toeken from _from
        require (_value <= allowance_a);
        addHolder(_to);                                                         //test if Staker exists and if not add to Holders list with clean slate.
        
        Info[_from].TokenBalance = (Info[_from].TokenBalance).sub(_value);
        Info[_to].TokenBalance = (Info[_to].TokenBalance).add(_value);
        allowed[_from][_to] = allowance_a.sub(_value);
        Transfer(_from, _to, _value);     
        
        return true;
    }


    function approve(address _spender, uint256 _value) returns (bool) {
        require((_value == 0) || (allowed[msg.sender][_spender] == 0));

        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }
    

    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }







    //############################################################################################################################################################
    // General Purpose functions
    //


    function getInfo(address _address) public view returns (uint256 ADD_TokenBalance, uint256 ADD_HolderId){      
        return (Info[_address].TokenBalance, Info[_address].HolderId );
    }


    function contractBalance() public view returns(uint){
        return address(this).balance;
    }
    

    function contractTokenBalance() public view returns(uint){
        return Info[owner].TokenBalance;
    }

    
    function balanceOf(address _address) constant returns (uint256 balance) {   //balance of address in Tokens
        return Info[_address].TokenBalance;
    }
    
    
    function HowmanyHolders(){
        numofHolders = Holders.length;
    }
    

    function TokenHolderExist(address _address) public view returns (bool) {
        if (Holders.length == 0)
            return false;

        return (Holders[Info[_address].HolderId] == _address);
    }


    function addHolder(address _address) internal returns (uint256) {
        require( _address != address(0));

        if (!TokenHolderExist(_address)) {
            var newHolder = HolderInfo(Holders.length, _address, 0);
            Info[_address] = newHolder ;
            Holders.push(_address);
            return newHolder.HolderId;
        }
    }

    

    
    //############################################################################################################################################################
    // 
    //  Contract owner functions:
    //

    // Gets deducted from owners balance and totalSupply.
    function ownerBurnToken(uint _value) onlyOwner {
        require(_value > 0);
        Info[owner].TokenBalance = (Info[owner].TokenBalance).sub(_value);
        totalSupply = totalSupply.sub(_value);
        Burn(msg.sender, _value);
    }
    
    // Gets added to TotalSupply.
    function ownerCreateToken(uint _value) onlyOwner {
        require(_value > 0);
        Info[owner].TokenBalance = (Info[owner].TokenBalance).add(_value);
        totalSupply = totalSupply.add(_value);
        Create(msg.sender, _value);
    }
    
    // Gets added to maxTotalSupply.
    function ownerIncreaseTokenMax(uint _value) onlyOwner {
        require(_value > 0);
        maxTotalSupply = maxTotalSupply.add(_value);
        IncreaseMax(msg.sender, _value);
    }
    
    // Withdraw EGEM to owners wallet
    function OwnerWithdraw(uint256 _amountToDraw) onlyOwner returns (bool) {
        owner.transfer(_amountToDraw);
        return true;
    }

     // ----------------------------------------------------------------------------------
     // ReleaseALL:  Releases the contract balance to the owners wallet address
     // Note: this is a function used while testing incase things go wrong, to avoid 
     // loosing coins in a contract that cant be interacted with.
     // ----------------------------------------------------------------------------------
    function ReleaseALL() onlyOwner {
        owner.transfer(address(this).balance);
    }
    
    // same as above but specific amount to be released to owners wallet.
    function ReleaseSOME(uint _some) onlyOwner {
        owner.transfer(_some);
    }
    
    // owner can send EGEM to contract.
    function OwnerDeposit() payable onlyOwner {
    }

    
    // ----------------------------------------------------------------------------------
    // EGEM to Token:
    //  Only Owner can interact with this function.
    //  Converts the msg.value (EGEM) to Tokens at a 1:4 ration EGEM:Tokens
    //  uses the ERC20 std functions todo it.
    // ---------------------------------------------------------------------------------- 
    function EGEM_To_Token(address _toAddress) payable onlyOwner {


        addHolder(_toAddress);                                                  //test if Staker exists and if not add to Holders list with clean slate.
        
        uint256 amount = msg.value;

        //amountdiv = amount.div(ratio);
        //amountdiv = (amount.div(ratio)).mul(4);
        amountdiv = (amount.mul(4)).div(ratio);
        
        allowed[owner][_toAddress] = amountdiv;                                 // allows _address to transferFrom(...)  "(amount.div(ratio))" tokens from Owner to themselves.
        Approval(owner, _toAddress, amountdiv);                                 // publish Event.

        transferFrom(owner, _toAddress, amountdiv);
        ownerCreateToken(amountdiv);
    }
    
    

    










}