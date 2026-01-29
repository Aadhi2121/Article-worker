import java.util.*;
public class Main{
    public static void main(String[] args){
        Scanner sc=new  Scanner(System.in);
        int[] asci=new int[128];
        System.out.println("Enter the number of strings");
        int n=sc.nextInt();
        String[] alph=new String[n];
        for(int i=0;i<n;i++){
            alph[i]=sc.next();

        }
        for(int i=0;i<n;i++){
            for(int j=0;j<alph[i].length();j++){
            if(asci[alph[i].charAt(j)]==i)asc0i[alph[i].charAt(j)]+=1;
        }}
        for(int i=65;i<128;i++){
            if(asci[i]==n)System.out.println((char)i);
        }
        
    }
}